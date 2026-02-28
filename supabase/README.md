# Supabase - Migraciones

## 1. Crear la tabla de categorías

1. Entra al [Dashboard de Supabase](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Copia y ejecuta el contenido de `migrations/001_create_categorias.sql`

## 2. Agregar columna imagen y bucket Storage

Ejecuta el contenido de `migrations/002_add_imagen_categorias.sql` en el SQL Editor.

## 3. Crear tabla de subcategorías

Ejecuta el contenido de `migrations/003_create_subcategorias.sql` en el SQL Editor.

## 4. Crear tabla de productos

Ejecuta `migrations/004_create_productos.sql` y luego `migrations/005_producto_imagenes_bucket.sql`.

Si el bucket `categoria-imagenes` no se crea automáticamente, créalo manualmente:
- Dashboard > Storage > New bucket > nombre: `categoria-imagenes` > Public: sí

---

O con Supabase CLI: `supabase db push`
