-- Función para dar salida a un lote con bloqueo (evita race condition)
-- Usa SELECT ... FOR UPDATE para bloquear la fila durante la operación
create or replace function dar_salida_lote_transaccional(p_lote_id uuid, p_cantidad int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cantidad_actual int;
  v_nueva_cantidad int;
begin
  if p_cantidad is null or p_cantidad < 1 then
    raise exception 'La cantidad debe ser mayor a 0';
  end if;

  -- Bloquear la fila para evitar race condition
  select cantidad into v_cantidad_actual
  from inventario_lotes
  where id = p_lote_id
  for update;

  if not found then
    raise exception 'Lote no encontrado';
  end if;

  if p_cantidad > v_cantidad_actual then
    raise exception 'Solo hay % unidades. No puedes dar salida a más.', v_cantidad_actual;
  end if;

  v_nueva_cantidad := v_cantidad_actual - p_cantidad;

  if v_nueva_cantidad = 0 then
    delete from inventario_lotes where id = p_lote_id;
  else
    update inventario_lotes set cantidad = v_nueva_cantidad where id = p_lote_id;
  end if;
end;
$$;

grant execute on function dar_salida_lote_transaccional(uuid, int) to service_role;
grant execute on function dar_salida_lote_transaccional(uuid, int) to authenticated;
