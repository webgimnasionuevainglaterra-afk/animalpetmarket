-- Hacer público el bucket producto-imagenes y asegurar políticas
-- (El bucket categoria-imagenes ya tiene PUBLIC; producto-imagenes debe igualarse)

update storage.buckets
set public = true
where id = 'producto-imagenes';

-- Políticas para que cualquiera pueda VER las imágenes
drop policy if exists "Imágenes de productos visibles para todos" on storage.objects;
create policy "Imágenes de productos visibles para todos"
  on storage.objects for select
  using (bucket_id = 'producto-imagenes');

-- Políticas para subir (service_role las usa; authenticated como respaldo)
drop policy if exists "Autenticados pueden insertar imágenes de productos" on storage.objects;
create policy "Autenticados pueden insertar imágenes de productos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'producto-imagenes');

drop policy if exists "Service role puede insertar imágenes de productos" on storage.objects;
create policy "Service role puede insertar imágenes de productos"
  on storage.objects for insert
  to service_role
  with check (bucket_id = 'producto-imagenes');
