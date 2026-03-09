"use server";

import { isValidUUID } from "@/lib/validations";
import { createAdminClient, requireAuth } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/roles";
import { revalidatePath } from "next/cache";

export async function crearVendedor(
  email: string,
  password: string,
  nombre: string,
  porcentajeComision: number
) {
  const auth = await requireAuth();
  if (auth.error) return auth;

  const perfil = await getPerfil(auth.user!.id);
  if (perfil?.rol !== "admin") return { error: "No autorizado" };

  if (!email?.trim()) return { error: "El email es obligatorio" };
  if (!password?.trim() || password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres" };
  if (!nombre?.trim()) return { error: "El nombre es obligatorio" };
  if (porcentajeComision < 0 || porcentajeComision > 100) return { error: "El porcentaje debe estar entre 0 y 100" };

  const supabase = createAdminClient();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email.trim(),
    password: password.trim(),
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes("already been registered")) return { error: "Ya existe un usuario con ese email" };
    return { error: authError.message };
  }

  if (!authData.user) return { error: "No se pudo crear el usuario" };

  const { data: vendedor, error: vendedorError } = await supabase
    .from("vendedores")
    .insert({
      user_id: authData.user.id,
      nombre: nombre.trim(),
      email: email.trim(),
      porcentaje_comision: porcentajeComision,
    })
    .select("id")
    .single();

  if (vendedorError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return { error: vendedorError.message };
  }

  const { error: perfilError } = await supabase.from("perfiles").insert({
    user_id: authData.user.id,
    rol: "vendedor",
    vendedor_id: vendedor.id,
  });

  if (perfilError) {
    await supabase.from("vendedores").delete().eq("id", vendedor.id);
    await supabase.auth.admin.deleteUser(authData.user.id);
    return { error: perfilError.message };
  }

  revalidatePath("/dashboard/vendedores");
  return { success: true };
}

export async function actualizarVendedor(
  id: string,
  nombre: string,
  porcentajeComision: number,
  activo: boolean
) {
  const auth = await requireAuth();
  if (auth.error) return auth;

  const perfil = await getPerfil(auth.user!.id);
  if (perfil?.rol !== "admin") return { error: "No autorizado" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("vendedores")
    .update({
      nombre: nombre.trim(),
      porcentaje_comision: porcentajeComision,
      activo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/vendedores");
  return { success: true };
}

export async function eliminarVendedor(id: string) {
  const auth = await requireAuth();
  if (auth.error) return auth;

  const perfil = await getPerfil(auth.user!.id);
  if (perfil?.rol !== "admin") return { error: "No autorizado" };
  if (!isValidUUID(id)) return { error: "Vendedor inválido" };

  const supabase = createAdminClient();

  const { data: vendedor, error: vendedorError } = await supabase
    .from("vendedores")
    .select("id, user_id, nombre")
    .eq("id", id)
    .single();
  if (vendedorError || !vendedor) {
    return { error: vendedorError?.message ?? "No se encontró el vendedor" };
  }

  // Limpiar referencias explícitas antes del borrado para evitar datos colgando
  const { error: perfilesError } = await supabase
    .from("perfiles")
    .delete()
    .eq("user_id", vendedor.user_id);
  if (perfilesError) return { error: perfilesError.message };

  const { error: deleteError } = await supabase
    .from("vendedores")
    .delete()
    .eq("id", id);
  if (deleteError) return { error: deleteError.message };

  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(vendedor.user_id);
  if (authDeleteError) {
    return {
      error: `Se eliminó el vendedor, pero no se pudo borrar su usuario de acceso: ${authDeleteError.message}`,
    };
  }

  revalidatePath("/dashboard/vendedores");
  revalidatePath("/dashboard/pedidos");
  revalidatePath("/dashboard/clientes");
  return { success: true };
}
