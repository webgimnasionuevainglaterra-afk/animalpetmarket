-- Bucket para imágenes de productos
insert into storage.buckets (id, name, public)
values ('producto-imagenes', 'producto-imagenes', true)
on conflict (id) do nothing;

drop policy if exists "Imágenes de productos visibles para todos" on storage.objects;
create policy "Imágenes de productos visibles para todos"
  on storage.objects for select
  using (bucket_id = 'producto-imagenes');

drop policy if exists "Autenticados pueden subir imágenes de productos" on storage.objects;
create policy "Autenticados pueden subir imágenes de productos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'producto-imagenes');

drop policy if exists "Autenticados pueden actualizar imágenes de productos" on storage.objects;
create policy "Autenticados pueden actualizar imágenes de productos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'producto-imagenes');

drop policy if exists "Autenticados pueden eliminar imágenes de productos" on storage.objects;
create policy "Autenticados pueden eliminar imágenes de productos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'producto-imagenes');
