-- ============================================================
-- MIGRACIONES PARA EJECUTAR EN SUPABASE (SQL Editor)
-- Ejecutar en orden, o todo junto
-- ============================================================

-- ========== 028: Vendedores y perfiles ==========
create table if not exists vendedores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  nombre text not null,
  email text not null,
  porcentaje_comision decimal(5,2) not null default 0 check (porcentaje_comision >= 0 and porcentaje_comision <= 100),
  activo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists perfiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  rol text not null check (rol in ('admin', 'vendedor')),
  vendedor_id uuid references vendedores(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists perfiles_user_id_idx on perfiles (user_id);
create index if not exists perfiles_rol_idx on perfiles (rol);
create index if not exists vendedores_user_id_idx on vendedores (user_id);

alter table pedidos add column if not exists vendedor_id uuid references vendedores(id) on delete set null;
alter table clientes add column if not exists vendedor_id uuid references vendedores(id) on delete set null;

create index if not exists pedidos_vendedor_id_idx on pedidos (vendedor_id);
create index if not exists clientes_vendedor_id_idx on clientes (vendedor_id);


-- ========== 029: Crear pedido con vendedor ==========
create or replace function crear_pedido_transaccional(
  p_nombre_cliente text,
  p_telefono text,
  p_direccion text,
  p_notas text,
  p_total decimal,
  p_items jsonb,
  p_cupon_codigo text default null,
  p_vendedor_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_pedido_id uuid;
  v_cliente_id uuid;
  v_item jsonb;
  v_subtotal decimal;
  v_aplica_iva boolean;
  v_cupon_id uuid;
  v_porcentaje smallint;
  v_total_final decimal;
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

  v_total_final := p_total;

  if nullif(trim(p_cupon_codigo), '') is not null then
    select id, porcentaje into v_cupon_id, v_porcentaje
    from cupones
    where upper(trim(codigo)) = upper(trim(p_cupon_codigo))
      and usado = false
      and (valido_hasta is null or valido_hasta >= current_date)
    limit 1;
    if v_cupon_id is null then
      raise exception 'Cupón inválido, ya utilizado o expirado';
    end if;
    v_total_final := p_total * (1 - v_porcentaje::decimal / 100);
  end if;

  insert into clientes (nombre, telefono, direccion, updated_at, vendedor_id)
  values (
    nullif(trim(p_nombre_cliente), ''),
    nullif(trim(p_telefono), ''),
    nullif(trim(p_direccion), ''),
    now(),
    p_vendedor_id
  )
  on conflict (telefono) do update set
    nombre = excluded.nombre,
    direccion = excluded.direccion,
    updated_at = now(),
    vendedor_id = coalesce(excluded.vendedor_id, clientes.vendedor_id)
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
    token_factura,
    vendedor_id
  ) values (
    nullif(trim(p_nombre_cliente), ''),
    nullif(trim(p_telefono), ''),
    nullif(trim(p_direccion), ''),
    nullif(trim(coalesce(p_notas, '')), ''),
    v_total_final,
    'pendiente',
    v_cliente_id,
    encode(gen_random_bytes(24), 'hex'),
    p_vendedor_id
  )
  returning id into v_pedido_id;

  if v_pedido_id is null then
    raise exception 'No se pudo crear el pedido';
  end if;

  if v_cupon_id is not null then
    update cupones set usado = true, pedido_id = v_pedido_id where id = v_cupon_id;
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


-- ========== 030: Domiciliarios ==========
create table if not exists domiciliarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  nombre text not null,
  placa text not null unique,
  telefono text not null,
  activo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists domiciliarios_user_id_idx on domiciliarios (user_id);
create index if not exists domiciliarios_placa_idx on domiciliarios (placa);

alter table perfiles drop constraint if exists perfiles_rol_check;
alter table perfiles add constraint perfiles_rol_check
  check (rol in ('admin', 'vendedor', 'domiciliario'));

alter table perfiles add column if not exists domiciliario_id uuid references domiciliarios(id) on delete set null;
create index if not exists perfiles_domiciliario_id_idx on perfiles (domiciliario_id);

alter table pedidos add column if not exists domiciliario_id uuid references domiciliarios(id) on delete set null;
alter table pedidos add column if not exists entrega_foto_url text;

create index if not exists pedidos_domiciliario_id_idx on pedidos (domiciliario_id);

insert into storage.buckets (id, name, public)
values ('entrega-fotos', 'entrega-fotos', true)
on conflict (id) do nothing;

drop policy if exists "Fotos entrega visibles para todos" on storage.objects;
create policy "Fotos entrega visibles para todos"
  on storage.objects for select
  using (bucket_id = 'entrega-fotos');

drop policy if exists "Autenticados pueden subir fotos entrega" on storage.objects;
create policy "Autenticados pueden subir fotos entrega"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'entrega-fotos');
