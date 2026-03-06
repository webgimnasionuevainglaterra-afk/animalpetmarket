"use server";

import { createAdminClient } from "@/lib/supabase/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function suscribirNewsletter(email: string) {
  const e = (email ?? "").trim().toLowerCase();
  if (!e) return { error: "Ingresa tu correo electrónico" };
  if (!EMAIL_REGEX.test(e)) return { error: "Correo electrónico inválido" };
  if (e.length > 254) return { error: "Correo demasiado largo" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("suscriptores")
    .insert({ email: e })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { success: true };
    return { error: error.message };
  }
  return { success: true };
}
