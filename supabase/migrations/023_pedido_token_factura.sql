-- Incluir token_factura al crear pedido
create or replace function crear_pedido_transaccional(
  p_nombre_cliente text,
  p_telefono text,
  p_direccion text,
  p_notas text,
  p_total decimal,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido_id uuid;
  v_cliente_id uuid;
  v_item jsonb;
  v_subtotal decimal;
  v_aplica_iva boolean;
begin
  if nullif(trim(p_nombre_cliente), '') is null then
    raise exception 'El nombre es obligatorio';
  end if;
  if nullif(trim(p_telefono), '') is null then
    raise exception 'El teléfono es obligatorio';
  end if;
  if nullif(trim(p_direccion), '') is null then
    raise exception 'La dirección es obligatoria';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito está vacío';
  end if;

  -- Crear o actualizar cliente por teléfono
  insert into clientes (nombre, telefono, direccion, updated_at)
  values (
    nullif(trim(p_nombre_cliente), ''),
    nullif(trim(p_telefono), ''),
    nullif(trim(p_direccion), ''),
    now()
  )
  on conflict (telefono) do update set
    nombre = excluded.nombre,
    direccion = excluded.direccion,
    updated_at = now()
  returning id into v_cliente_id;

  if v_cliente_id is null then
    select id into v_cliente_id from clientes where telefono = nullif(trim(p_telefono), '') limit 1;
  end if;

  insert into pedidos (
    nombre_cliente,
    telefono,
    direccion,
    notas,
    total,
    estado,
    cliente_id,
    token_factura
  ) values (
    nullif(trim(p_nombre_cliente), ''),
    nullif(trim(p_telefono), ''),
    nullif(trim(p_direccion), ''),
    nullif(trim(coalesce(p_notas, '')), ''),
    p_total,
    'pendiente',
    v_cliente_id,
    encode(gen_random_bytes(24), 'hex')
  )
  returning id into v_pedido_id;

  if v_pedido_id is null then
    raise exception 'No se pudo crear el pedido';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_subtotal := (v_item->>'precio_unitario')::decimal * (v_item->>'cantidad')::int;
    v_aplica_iva := coalesce((v_item->>'aplica_iva')::boolean, false);

    insert into pedido_items (
      pedido_id,
      producto_id,
      nombre,
      presentacion,
      cantidad,
      precio_unitario,
      subtotal,
      aplica_iva
    ) values (
      v_pedido_id,
      (v_item->>'producto_id')::uuid,
      v_item->>'nombre',
      v_item->>'presentacion',
      (v_item->>'cantidad')::int,
      (v_item->>'precio_unitario')::decimal,
      v_subtotal,
      v_aplica_iva
    );
  end loop;

  return v_pedido_id;
end;
$$;
