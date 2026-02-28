import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Llamado desde Server Component; el middleware refresca la sesión
          }
        },
      },
    }
  );
}

/** Verifica que el usuario esté autenticado. Usar al inicio de server actions del dashboard. */
export async function requireAuth() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) return { error: "No autorizado. Inicia sesión." };
  return { user: data.user };
}

/** Cliente admin con service_role para Storage (bypass RLS). Solo usar en servidor. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY");
  return createSupabaseClient(url, key);
}
