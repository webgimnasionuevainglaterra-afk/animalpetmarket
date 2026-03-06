"use server";

import { createAdminClient, requireAuth } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const CARACTERES = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generarCodigo6(): string {
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => CARACTERES[b % CARACTERES.length]).join("");
}

export async function crearCupon(porcentaje: number, validoHasta: string | null) {
  const auth = await requireAuth();
  if (auth.error) return auth;

  if (porcentaje < 1 || porcentaje > 99) {
    return { error: "El porcentaje debe estar entre 1 y 99" };
  }

  const supabase = createAdminClient();

  let codigo = generarCodigo6();
  let intentos = 0;
  const maxIntentos = 10;
  while (intentos < maxIntentos) {
    const { data: existente } = await supabase
      .from("cupones")
      .select("id")
      .eq("codigo", codigo)
      .single();
    if (!existente) break;
    codigo = generarCodigo6();
    intentos++;
  }
  if (intentos >= maxIntentos) {
    return { error: "No se pudo generar un código único. Intenta de nuevo." };
  }

  const insert: { codigo: string; porcentaje: number; valido_hasta?: string | null } = {
    codigo,
    porcentaje,
  };
  if (validoHasta?.trim()) {
    const match = validoHasta.trim().match(/^\d{4}-\d{2}-\d{2}$/);
    if (match) insert.valido_hasta = validoHasta.trim();
  }

  const { data, error } = await supabase
    .from("cupones")
    .insert(insert)
    .select("id, codigo, porcentaje, valido_hasta")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/cupones");
  return { success: true, cupon: data };
}
