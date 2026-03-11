-- Permite que un producto pertenezca a varias subcategorias
create table if not exists producto_subcategorias (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references productos(id) on delete cascade,
  subcategoria_id uuid not null references subcategorias(id) on delete cascade,
  created_at timestamptz default now(),
  unique(producto_id, subcategoria_id)
);

create index if not exists producto_subcategorias_producto_id_idx
  on producto_subcategorias (producto_id);

create index if not exists producto_subcategorias_subcategoria_id_idx
  on producto_subcategorias (subcategoria_id);

-- Migrar la subcategoria principal actual a la tabla pivote
insert into producto_subcategorias (producto_id, subcategoria_id)
select id, subcategoria_id
from productos
where subcategoria_id is not null
on conflict (producto_id, subcategoria_id) do nothing;

alter table producto_subcategorias enable row level security;

drop policy if exists "Relaciones producto-subcategoria visibles para todos" on producto_subcategorias;
create policy "Relaciones producto-subcategoria visibles para todos"
  on producto_subcategorias for select using (true);

drop policy if exists "Autenticados pueden insertar relaciones producto-subcategoria" on producto_subcategorias;
create policy "Autenticados pueden insertar relaciones producto-subcategoria"
  on producto_subcategorias for insert to authenticated with check (true);

drop policy if exists "Autenticados pueden actualizar relaciones producto-subcategoria" on producto_subcategorias;
create policy "Autenticados pueden actualizar relaciones producto-subcategoria"
  on producto_subcategorias for update to authenticated using (true);

drop policy if exists "Autenticados pueden eliminar relaciones producto-subcategoria" on producto_subcategorias;
create policy "Autenticados pueden eliminar relaciones producto-subcategoria"
  on producto_subcategorias for delete to authenticated using (true);
