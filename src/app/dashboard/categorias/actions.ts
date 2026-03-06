"use server";

import { isValidUUID, sanitizarTexto, validarLongitud } from "@/lib/validations";
import { createAdminClient, createClient, requireAuth } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const MAX_NOMBRE = 100;
const MAX_IMAGEN_MB = 2;

export type Categoria = {
  id: string;
  nombre: string;
  imagen: string | null;
  created_at: string;
};

const BUCKET = "categoria-imagenes";

async function subirImagen(file: File): Promise<string | null> {
  if (!file?.size) return null;
  if (file.size > MAX_IMAGEN_MB * 1024 * 1024) return null;
  const tipos = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!tipos.includes(file.type)) return null;
  const supabase = createAdminClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function crearCategoria(formData: FormData) {
  const auth = await requireAuth();
  if (auth.error) return auth;

  const nombre = formData.get("nombre") as string;
  if (!nombre?.trim()) return { error: "El nombre es obligatorio" };
  const errNombre = validarLongitud(nombre, MAX_NOMBRE);
  if (errNombre) return { error: errNombre };

  const supabase = await createClient();
  const file = formData.get("imagen") as File | null;
  let imagen: string | null = null;
  if (file?.size) {
    if (file.size > MAX_IMAGEN_MB * 1024 * 1024) return { error: `La imagen no puede superar ${MAX_IMAGEN_MB} MB` };
    imagen = await subirImagen(file);
    if (!imagen) return { error: "No se pudo subir la imagen. Verifica el bucket categoria-imagenes en Supabase." };
  }

  const { error } = await supabase.from("categorias").insert({
    nombre: sanitizarTexto(nombre, MAX_NOMBRE),
    imagen,
  });

  if (error) {
    if (error.code === "23505") return { error: "Ya existe una categoría con ese nombre" };
    return { error: error.message };
  }

  revalidatePath("/dashboard/categorias");
  revalidatePath("/");
  return { success: true };
}

export async function actualizarCategoria(id: string, formData: FormData) {
  const auth = await requireAuth();
  if (auth.error) return auth;
  if (!isValidUUID(id)) return { error: "ID inválido" };

  const nombre = formData.get("nombre") as string;
  if (!nombre?.trim()) return { error: "El nombre es obligatorio" };
  const errNombre = validarLongitud(nombre, MAX_NOMBRE);
  if (errNombre) return { error: errNombre };

  const supabase = await createClient();
  const file = formData.get("imagen") as File | null;
  const quitarFoto = formData.get("quitar_foto") === "1";
  if (file?.size && file.size > MAX_IMAGEN_MB * 1024 * 1024) return { error: `La imagen no puede superar ${MAX_IMAGEN_MB} MB` };
  let imagen: string | null | undefined;
  if (quitarFoto) {
    imagen = null;
  } else if (file?.size) {
    const url = await subirImagen(file);
    if (!url) return { error: "No se pudo subir la imagen. Verifica el bucket categoria-imagenes en Supabase." };
    imagen = url;
  }

  const update: { nombre: string; imagen?: string | null } = { nombre: sanitizarTexto(nombre, MAX_NOMBRE) };
  if (imagen !== undefined) update.imagen = imagen;

  const { error } = await supabase
    .from("categorias")
    .update(update)
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "Ya existe una categoría con ese nombre" };
    return { error: error.message };
  }

  revalidatePath("/dashboard/categorias");
  revalidatePath("/");
  return { success: true };
}

export async function eliminarCategoria(id: string) {
  const auth = await requireAuth();
  if (auth.error) return auth;
  if (!isValidUUID(id)) return { error: "ID inválido" };

  const supabase = await createClient();
  const { error } = await supabase.from("categorias").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/categorias");
  revalidatePath("/");
  return { success: true };
}
