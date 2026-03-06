"use server";

import { createAdminClient, requireAuth } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/roles";
import { revalidatePath } from "next/cache";

import { placaToEmail } from "@/lib/domiciliario-auth";

export async function crearDomiciliario(nombre: string, placa: string, telefono: string) {
  const auth = await requireAuth();
  if (auth.error) return auth;

  const perfil = await getPerfil(auth.user!.id);
  if (perfil?.rol !== "admin") return { error: "No autorizado" };

  if (!nombre?.trim()) return { error: "El nombre es obligatorio" };
  if (!placa?.trim()) return { error: "La placa es obligatoria" };
  if (!telefono?.trim()) return { error: "El teléfono es obligatorio" };
  if (telefono.length < 6) return { error: "El teléfono debe tener al menos 6 caracteres (se usa como contraseña)" };

  const supabase = createAdminClient();
  const email = placaToEmail(placa);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: telefono.trim(),
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes("already been registered"))
      return { error: "Ya existe un domiciliario con esa placa" };
    return { error: authError.message };
  }

  if (!authData.user) return { error: "No se pudo crear el usuario" };

  const { data: domiciliario, error: domError } = await supabase
    .from("domiciliarios")
    .insert({
      user_id: authData.user.id,
      nombre: nombre.trim(),
      placa: placa.trim().toUpperCase(),
      telefono: telefono.trim(),
    })
    .select("id")
    .single();

  if (domError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return { error: domError.message };
  }

  const { error: perfilError } = await supabase.from("perfiles").insert({
    user_id: authData.user.id,
    rol: "domiciliario",
    domiciliario_id: domiciliario.id,
  });

  if (perfilError) {
    await supabase.from("domiciliarios").delete().eq("id", domiciliario.id);
    await supabase.auth.admin.deleteUser(authData.user.id);
    return { error: perfilError.message };
  }

  revalidatePath("/dashboard/domiciliarios");
  return { success: true };
}

export async function actualizarDomiciliario(
  id: string,
  nombre: string,
  placa: string,
  telefono: string,
  activo: boolean
) {
  const auth = await requireAuth();
  if (auth.error) return auth;

  const perfil = await getPerfil(auth.user!.id);
  if (perfil?.rol !== "admin") return { error: "No autorizado" };

  if (!nombre?.trim()) return { error: "El nombre es obligatorio" };
  if (!placa?.trim()) return { error: "La placa es obligatoria" };
  if (!telefono?.trim()) return { error: "El teléfono es obligatorio" };

  const supabase = createAdminClient();

  const { data: dom } = await supabase.from("domiciliarios").select("user_id").eq("id", id).single();
  if (dom?.user_id) {
    await supabase.auth.admin.updateUserById(dom.user_id, { password: telefono.trim() });
  }

  const { error } = await supabase
    .from("domiciliarios")
    .update({
      nombre: nombre.trim(),
      placa: placa.trim().toUpperCase(),
      telefono: telefono.trim(),
      activo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/domiciliarios");
  return { success: true };
}
