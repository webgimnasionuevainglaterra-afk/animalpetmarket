-- Agregar columna imagen a categorías (URL de la imagen en Storage)
alter table categorias add column if not exists imagen text;

-- Crear bucket para imágenes de categorías
-- Nota: si falla, crea el bucket manualmente en Dashboard > Storage > New bucket > "categoria-imagenes" (public)
insert into storage.buckets (id, name, public)
values ('categoria-imagenes', 'categoria-imagenes', true)
on conflict (id) do nothing;

-- Políticas: lectura pública, escritura solo autenticados
drop policy if exists "Imágenes de categorías visibles para todos" on storage.objects;
create policy "Imágenes de categorías visibles para todos"
  on storage.objects for select
  using (bucket_id = 'categoria-imagenes');

drop policy if exists "Autenticados pueden subir imágenes de categorías" on storage.objects;
create policy "Autenticados pueden subir imágenes de categorías"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'categoria-imagenes');

drop policy if exists "Autenticados pueden actualizar imágenes de categorías" on storage.objects;
create policy "Autenticados pueden actualizar imágenes de categorías"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'categoria-imagenes');

drop policy if exists "Autenticados pueden eliminar imágenes de categorías" on storage.objects;
create policy "Autenticados pueden eliminar imágenes de categorías"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'categoria-imagenes');
