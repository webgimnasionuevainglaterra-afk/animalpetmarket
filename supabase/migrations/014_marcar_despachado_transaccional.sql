-- Función para marcar pedido como despachado en una transacción atómica
-- Incluye: update pedido, upsert ventas, descuento inventario FIFO
-- Usa FOR UPDATE para evitar race conditions
create or replace function marcar_despachado_transaccional(p_pedido_id uuid, p_total decimal)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_pp_id uuid;
  v_cant int;
  v_restar int;
  v_lote record;
  v_disp int;
  v_quitar int;
  v_stock_total int;
  v_hoy date := current_date;
begin
  -- Verificar que el pedido existe y no está ya despachado
  if not exists (select 1 from pedidos where id = p_pedido_id) then
    raise exception 'Pedido no encontrado';
  end if;

  if exists (select 1 from pedidos where id = p_pedido_id and estado = 'despachado') then
    raise exception 'El pedido ya está despachado';
  end if;

  -- 1. Actualizar estado del pedido
  update pedidos set estado = 'despachado' where id = p_pedido_id;

  -- 2. Upsert ventas
  insert into ventas (pedido_id, total, fecha_venta)
  values (p_pedido_id, p_total, v_hoy)
  on conflict (pedido_id) do update set total = p_total, fecha_venta = v_hoy;

  -- 3. Descontar inventario (FIFO) por cada ítem
  for v_item in
    select producto_id, presentacion, cantidad
    from pedido_items
    where pedido_id = p_pedido_id and producto_id is not null
  loop
    v_cant := v_item.cantidad;

    -- Obtener producto_presentacion_id
    select id into v_pp_id
    from producto_presentaciones
    where producto_id = v_item.producto_id and nombre = v_item.presentacion;

    if v_pp_id is null then
      continue; -- Sin presentación, saltar
    end if;

    -- Verificar stock disponible
    select coalesce(sum(cantidad), 0)::int into v_stock_total
    from inventario_lotes
    where producto_presentacion_id = v_pp_id
      and fecha_vencimiento >= v_hoy
      and cantidad > 0;

    if v_stock_total < v_cant then
      raise exception 'Stock insuficiente para % (%). Disponible: %, solicitado: %',
        coalesce((select nombre from productos where id = v_item.producto_id), 'producto'),
        v_item.presentacion,
        v_stock_total,
        v_cant;
    end if;

    -- Descontar FIFO (bloqueando filas con FOR UPDATE)
    v_restar := v_cant;
    for v_lote in
      select id, cantidad
      from inventario_lotes
      where producto_presentacion_id = v_pp_id
        and fecha_vencimiento >= v_hoy
        and cantidad > 0
      order by fecha_vencimiento
      for update
    loop
      exit when v_restar <= 0;
      v_disp := v_lote.cantidad;
      v_quitar := least(v_restar, v_disp);
      if v_quitar <= 0 then
        continue;
      end if;

      update inventario_lotes
      set cantidad = v_disp - v_quitar
      where id = v_lote.id;

      v_restar := v_restar - v_quitar;
    end loop;
  end loop;
end;
$$;

grant execute on function marcar_despachado_transaccional(uuid, decimal) to service_role;
grant execute on function marcar_despachado_transaccional(uuid, decimal) to authenticated;
