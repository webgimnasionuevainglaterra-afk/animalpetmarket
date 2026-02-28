# Centro Animal - Tienda virtual de mascotas

Proyecto base con:
- `Next.js` (App Router + TypeScript)
- `Tailwind CSS`
- `Supabase` (`@supabase/supabase-js`)
- Preparado para despliegue en `Vercel`

## Configuración inicial

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo de entorno:

```bash
cp .env.example .env.local
```

3. Completa tus claves de Supabase en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

4. Levanta el servidor de desarrollo:

```bash
npm run dev
```

Abre `http://localhost:3000` en tu navegador.

## Estructura clave

- `src/app/page.tsx`: homepage inicial con identidad visual de marca.
- `src/app/globals.css`: variables de color corporativo.
- `src/lib/supabase/client.ts`: cliente público (frontend) de Supabase.
- `src/lib/supabase/server.ts`: cliente privado (backend) de Supabase.
- `.env.example`: ejemplo de variables requeridas.

## Despliegue en Vercel

1. Sube este proyecto a GitHub.
2. Importa el repositorio en Vercel.
3. Configura en Vercel las variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
4. Ejecuta el deploy.
