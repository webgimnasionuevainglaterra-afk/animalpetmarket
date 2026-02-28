-- Inventario por lote y fecha de vencimiento
create table if not exists inventario_lotes (
  id uuid primary key default gen_random_uuid(),
  producto_presentacion_id uuid not null references producto_presentaciones(id) on delete cascade,
  lote text not null,
  cantidad int not null default 0 check (cantidad >= 0),
  fecha_vencimiento date not null,
  created_at timestamptz default now()
);

create index if not exists inventario_lotes_producto_presentacion_idx
  on inventario_lotes (producto_presentacion_id);
create index if not exists inventario_lotes_fecha_vencimiento_idx
  on inventario_lotes (fecha_vencimiento);

-- RLS
alter table inventario_lotes enable row level security;

drop policy if exists "Lotes visibles para autenticados" on inventario_lotes;
create policy "Lotes visibles para autenticados"
  on inventario_lotes for select to authenticated using (true);

drop policy if exists "Autenticados pueden insertar lotes" on inventario_lotes;
create policy "Autenticados pueden insertar lotes"
  on inventario_lotes for insert to authenticated with check (true);

drop policy if exists "Autenticados pueden actualizar lotes" on inventario_lotes;
create policy "Autenticados pueden actualizar lotes"
  on inventario_lotes for update to authenticated using (true);

drop policy if exists "Autenticados pueden eliminar lotes" on inventario_lotes;
create policy "Autenticados pueden eliminar lotes"
  on inventario_lotes for delete to authenticated using (true);
