"use server";

import { createAdminClient, requireAuth } from "@/lib/supabase/server";
import { sanitizarTexto } from "@/lib/validations";

export type ConfigData = {
  nombre_tienda: string | null;
  telefono: string | null;
  whatsapp: string | null;
  email: string | null;
  direccion: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
};

export async function guardarConfiguracion(formData: FormData) {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };

  const nombre_tienda = sanitizarTexto(String(formData.get("nombre_tienda") ?? ""), 120);
  const telefono = sanitizarTexto(String(formData.get("telefono") ?? ""), 30);
  const whatsapp = sanitizarTexto(String(formData.get("whatsapp") ?? ""), 30);
  const email = sanitizarTexto(String(formData.get("email") ?? ""), 120);
  const direccion = sanitizarTexto(String(formData.get("direccion") ?? ""), 200);
  const facebook_url = sanitizarTexto(String(formData.get("facebook_url") ?? ""), 200);
  const instagram_url = sanitizarTexto(String(formData.get("instagram_url") ?? ""), 200);

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("configuracion")
    .update({
      nombre_tienda: nombre_tienda || null,
      telefono: telefono || null,
      whatsapp: whatsapp || null,
      email: email || null,
      direccion: direccion || null,
      facebook_url: facebook_url || null,
      instagram_url: instagram_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    return { error: error.message };
  }
  return { success: true };
}
