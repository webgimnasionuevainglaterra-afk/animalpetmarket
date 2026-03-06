"use server";

import {
  isValidUUID,
  sanitizarTexto,
  validarLongitud,
  validarNumero,
} from "@/lib/validations";
import { createAdminClient, createClient, requireAuth } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const BUCKET = "producto-imagenes";
const MAX_NOMBRE = 200;
const MAX_DESCRIPCION = 2000;
const MAX_PRECIO = 999999999;
const MAX_PRESENTACION_NOMBRE = 50;
const MAX_IMAGEN_MB = 5;

export type Producto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number | string;
  imagen: string | null;
  subcategoria_id: string;
  peso: number | null;
  dimensiones: string | null;
  requiere_refrigeracion: boolean;
  producto_fragil: boolean;
  destacado: boolean;
  nuevo: boolean;
  mas_vendido: boolean;
  recomendado: boolean;
  porcentaje_oferta?: number | null;
  aplica_iva?: boolean | null;
  secciones_activas: string[];
  datos_medicamento: Record<string, unknown> | null;
  datos_alimento: Record<string, unknown> | null;
  datos_juguete: Record<string, unknown> | null;
  created_at: string;
};

export type ProductoPresentacion = {
  id: string;
  producto_id?: string;
  nombre: string;
  imagen: string | null;
  precio: number | null;
  orden: number;
};

async function subirImagen(file: File): Promise<{ url: string } | { error: string }> {
  if (!file?.size) return { url: "" };
  if (file.size > MAX_IMAGEN_MB * 1024 * 1024) return { error: `La imagen no puede superar ${MAX_IMAGEN_MB} MB` };
  const tipos = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!tipos.includes(file.type)) return { error: "Formato de imagen no permitido (JPEG, PNG, WebP, GIF)" };
  if (!process.env.SUPABASE_SECRET_KEY) {
    return { error: "Configura SUPABASE_SECRET_KEY en .env.local para subir imágenes" };
  }
  try {
    const supabase = createAdminClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) return { error: error.message };
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al subir imagen" };
  }
}

function parseJson(formData: FormData, key: string): Record<string, unknown> | null {
  const val = formData.get(key) as string | null;
  if (!val) return null;
  try {
    return JSON.parse(val) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseSecciones(formData: FormData): string[] {
  const secciones = formData.getAll("secciones_activas") as string[];
  return secciones.filter(Boolean);
}

export async function crearProducto(formData: FormData) {
  const auth = await requireAuth();
  if (auth.error) return auth;

  const nombre = formData.get("nombre") as string;
  const precio = parseFloat((formData.get("precio") as string) || "0");
  const subcategoria_id = formData.get("subcategoria_id") as string;

  if (!nombre?.trim()) return { error: "El nombre es obligatorio" };
  if (!subcategoria_id) return { error: "Selecciona una subcategoría" };
  const errNombre = validarLongitud(nombre, MAX_NOMBRE);
  if (errNombre) return { error: errNombre };
  const errPrecio = validarNumero(precio, 0, MAX_PRECIO, "El precio");
  if (errPrecio) return { error: errPrecio };
  if (!isValidUUID(subcategoria_id)) return { error: "Subcategoría inválida" };

  const desc = (formData.get("descripcion") as string) || "";
  if (desc) {
    const errDesc = validarLongitud(desc, MAX_DESCRIPCION, 0);
    if (errDesc) return { error: `Descripción: ${errDesc}` };
  }

  const dim = (formData.get("dimensiones") as string) || "";
  if (dim && dim.length > 100) return { error: "Dimensiones: máximo 100 caracteres" };

  const supabase = await createClient();
  const file = formData.get("imagen") as File | null;
  let imagen: string | null = null;
  if (file?.size) {
    const res = await subirImagen(file);
    if ("error" in res) return { error: `Imagen: ${res.error}` };
    imagen = res.url || null;
  }

  const aplicaIva = formData.get("aplica_iva") === "1";
  const porcentajeOfertaVal = formData.get("porcentaje_oferta") as string;
  const porcentajeOferta = porcentajeOfertaVal ? parseInt(porcentajeOfertaVal, 10) : null;
  const insert: Record<string, unknown> = {
    nombre: sanitizarTexto(nombre, MAX_NOMBRE),
    descripcion: desc ? sanitizarTexto(desc, MAX_DESCRIPCION) : null,
    precio,
    aplica_iva: aplicaIva,
    imagen,
    subcategoria_id,
    porcentaje_oferta: porcentajeOferta != null && porcentajeOferta >= 1 && porcentajeOferta <= 99 ? porcentajeOferta : null,
    peso: formData.get("peso") ? parseFloat(formData.get("peso") as string) : null,
    dimensiones: dim ? sanitizarTexto(dim, 100) : null,
    requiere_refrigeracion: formData.get("requiere_refrigeracion") === "1",
    producto_fragil: formData.get("producto_fragil") === "1",
    destacado: formData.get("destacado") === "1",
    nuevo: formData.get("nuevo") === "1",
    mas_vendido: formData.get("mas_vendido") === "1",
    recomendado: formData.get("recomendado") === "1",
    secciones_activas: parseSecciones(formData),
    datos_medicamento: parseJson(formData, "datos_medicamento"),
    datos_alimento: parseJson(formData, "datos_alimento"),
    datos_juguete: parseJson(formData, "datos_juguete"),
  };

  const { data: inserted, error } = await supabase
    .from("productos")
    .insert(insert)
    .select("id")
    .single();

  if (error) return { error: error.message };
  const productoId = inserted?.id;
  if (!productoId) return { error: "No se pudo crear el producto" };

  // Crear presentaciones (si no hay ninguna, crear "Principal" para que aparezca en inventario)
  let orden = 0;
  for (let i = 0; i < 50; i++) {
    const nombrePres = (formData.get(`presentacion_${i}_nombre`) as string | null)?.trim();
    if (nombrePres === undefined || nombrePres === null) break;
    if (!nombrePres) continue;
    const errPresNombre = validarLongitud(nombrePres, MAX_PRESENTACION_NOMBRE);
    if (errPresNombre) return { error: `Presentación ${i + 1}: ${errPresNombre}` };
    const precioVal = formData.get(`presentacion_${i}_precio`) as string;
    const precioPres = precioVal ? parseFloat(precioVal) : null;
    if (precioPres != null && (precioPres < 0 || precioPres > MAX_PRECIO)) return { error: `Presentación "${nombrePres}": precio inválido` };
    const file = formData.get(`presentacion_${i}_imagen`) as File | null;
    let imagen: string | null = null;
    if (file?.size) {
      const res = await subirImagen(file);
      if ("error" in res) return { error: `Presentación ${i + 1} imagen: ${res.error}` };
      if ("url" in res && res.url) imagen = res.url;
    }
    const aplicaIvaPres = formData.get(`presentacion_${i}_aplica_iva`) === "1";
    const ofertaPresVal = formData.get(`presentacion_${i}_oferta`) as string;
    const porcentajeOfertaPres = ofertaPresVal ? parseInt(ofertaPresVal, 10) : null;
    const { error: errPres } = await supabase.from("producto_presentaciones").insert({
      producto_id: productoId,
      nombre: sanitizarTexto(nombrePres, MAX_PRESENTACION_NOMBRE),
      imagen,
      precio: precioPres,
      aplica_iva: aplicaIvaPres,
      porcentaje_oferta: porcentajeOfertaPres != null && porcentajeOfertaPres >= 1 && porcentajeOfertaPres <= 99 ? porcentajeOfertaPres : null,
      orden: orden++,
    });
    if (errPres) return { error: `Error al crear presentación "${nombrePres}": ${errPres.message}` };
  }

  // Si no se creó ninguna presentación, crear "Principal" para que el producto aparezca en inventario
  if (orden === 0) {
    const { error: errPrincipal } = await supabase.from("producto_presentaciones").insert({
      producto_id: productoId,
      nombre: "Principal",
      imagen: null,
      precio,
      aplica_iva: aplicaIva,
      porcentaje_oferta: porcentajeOferta != null && porcentajeOferta >= 1 && porcentajeOferta <= 99 ? porcentajeOferta : null,
      orden: 0,
    });
    if (errPrincipal) return { error: `Error al crear presentación Principal: ${errPrincipal.message}` };
  }

  revalidatePath("/dashboard/productos");
  revalidatePath("/");
  revalidatePath("/ofertas");
  revalidatePath("/dashboard/inventario");
  return { success: true };
}

export async function actualizarProducto(id: string, formData: FormData) {
  const auth = await requireAuth();
  if (auth.error) return auth;
  if (!isValidUUID(id)) return { error: "ID inválido" };

  const nombre = formData.get("nombre") as string;
  const precio = parseFloat((formData.get("precio") as string) || "0");
  const subcategoria_id = formData.get("subcategoria_id") as string;

  if (!nombre?.trim()) return { error: "El nombre es obligatorio" };
  if (!subcategoria_id) return { error: "Selecciona una subcategoría" };
  const errNombre = validarLongitud(nombre, MAX_NOMBRE);
  if (errNombre) return { error: errNombre };
  const errPrecio = validarNumero(precio, 0, MAX_PRECIO, "El precio");
  if (errPrecio) return { error: errPrecio };
  if (!isValidUUID(subcategoria_id)) return { error: "Subcategoría inválida" };

  const descUpdate = (formData.get("descripcion") as string) || "";
  if (descUpdate && descUpdate.length > MAX_DESCRIPCION) return { error: "Descripción: máximo 2000 caracteres" };
  const dimUpdate = (formData.get("dimensiones") as string) || "";
  if (dimUpdate && dimUpdate.length > 100) return { error: "Dimensiones: máximo 100 caracteres" };

  const supabase = await createClient();
  const file = formData.get("imagen") as File | null;
  let imagen: string | undefined;
  if (file?.size) {
    const res = await subirImagen(file);
    if ("error" in res) return { error: `Imagen: ${res.error}` };
    if ("url" in res && res.url) imagen = res.url;
  }

  const aplicaIva = formData.get("aplica_iva") === "1";
  const porcentajeOfertaVal = formData.get("porcentaje_oferta") as string;
  const porcentajeOferta = porcentajeOfertaVal ? parseInt(porcentajeOfertaVal, 10) : null;
  const update: Record<string, unknown> = {
    nombre: sanitizarTexto(nombre, MAX_NOMBRE),
    descripcion: descUpdate ? sanitizarTexto(descUpdate, MAX_DESCRIPCION) : null,
    precio,
    aplica_iva: aplicaIva,
    porcentaje_oferta: porcentajeOferta != null && porcentajeOferta >= 1 && porcentajeOferta <= 99 ? porcentajeOferta : null,
    subcategoria_id,
    peso: formData.get("peso") ? parseFloat(formData.get("peso") as string) : null,
    dimensiones: dimUpdate ? sanitizarTexto(dimUpdate, 100) : null,
    requiere_refrigeracion: formData.get("requiere_refrigeracion") === "1",
    producto_fragil: formData.get("producto_fragil") === "1",
    destacado: formData.get("destacado") === "1",
    nuevo: formData.get("nuevo") === "1",
    mas_vendido: formData.get("mas_vendido") === "1",
    recomendado: formData.get("recomendado") === "1",
    secciones_activas: parseSecciones(formData),
    datos_medicamento: parseJson(formData, "datos_medicamento"),
    datos_alimento: parseJson(formData, "datos_alimento"),
    datos_juguete: parseJson(formData, "datos_juguete"),
  };
  if (imagen !== undefined) update.imagen = imagen;

  const { error } = await supabase.from("productos").update(update).eq("id", id);

  if (error) return { error: error.message };

  // Actualizar presentaciones: eliminar existentes e insertar las nuevas
  const { error: errDel } = await supabase.from("producto_presentaciones").delete().eq("producto_id", id);
  if (errDel) return { error: `Error al actualizar presentaciones: ${errDel.message}` };

  let orden = 0;
  for (let i = 0; i < 50; i++) {
    const nombrePres = (formData.get(`presentacion_${i}_nombre`) as string | null)?.trim();
    if (nombrePres === undefined || nombrePres === null) break;
    if (!nombrePres) continue;
    const errPresNombre = validarLongitud(nombrePres, MAX_PRESENTACION_NOMBRE);
    if (errPresNombre) return { error: `Presentación ${i + 1}: ${errPresNombre}` };
    const precioVal = formData.get(`presentacion_${i}_precio`) as string;
    const precioPres = precioVal ? parseFloat(precioVal) : null;
    if (precioPres != null && (precioPres < 0 || precioPres > MAX_PRECIO)) return { error: `Presentación "${nombrePres}": precio inválido` };
    const file = formData.get(`presentacion_${i}_imagen`) as File | null;
    let imagen: string | null = null;
    if (file?.size) {
      const res = await subirImagen(file);
      if ("error" in res) return { error: `Presentación ${i + 1} imagen: ${res.error}` };
      if ("url" in res && res.url) imagen = res.url;
    } else {
      const urlExistente = formData.get(`presentacion_${i}_imagen_url`) as string;
      if (urlExistente) imagen = urlExistente;
    }
    const aplicaIvaPres = formData.get(`presentacion_${i}_aplica_iva`) === "1";
    const ofertaPresVal = formData.get(`presentacion_${i}_oferta`) as string;
    const porcentajeOfertaPres = ofertaPresVal ? parseInt(ofertaPresVal, 10) : null;
    const { error: errPres } = await supabase.from("producto_presentaciones").insert({
      producto_id: id,
      nombre: sanitizarTexto(nombrePres, MAX_PRESENTACION_NOMBRE),
      imagen,
      precio: precioPres,
      aplica_iva: aplicaIvaPres,
      porcentaje_oferta: porcentajeOfertaPres != null && porcentajeOfertaPres >= 1 && porcentajeOfertaPres <= 99 ? porcentajeOfertaPres : null,
      orden: orden++,
    });
    if (errPres) return { error: `Error al crear presentación "${nombrePres}": ${errPres.message}` };
  }

  // Si no quedó ninguna presentación, crear "Principal" para que aparezca en inventario
  if (orden === 0) {
    const { error: errPrincipal } = await supabase.from("producto_presentaciones").insert({
      producto_id: id,
      nombre: "Principal",
      imagen: null,
      precio,
      aplica_iva: aplicaIva,
      porcentaje_oferta: porcentajeOferta != null && porcentajeOferta >= 1 && porcentajeOferta <= 99 ? porcentajeOferta : null,
      orden: 0,
    });
    if (errPrincipal) return { error: `Error al crear presentación Principal: ${errPrincipal.message}` };
  }

  revalidatePath("/dashboard/productos");
  revalidatePath("/");
  revalidatePath("/ofertas");
  revalidatePath("/dashboard/inventario");
  return { success: true };
}

export async function eliminarProducto(id: string) {
  const auth = await requireAuth();
  if (auth.error) return auth;
  if (!isValidUUID(id)) return { error: "ID inválido" };

  const supabase = await createClient();
  const { error } = await supabase.from("productos").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/productos");
  revalidatePath("/");
  revalidatePath("/ofertas");
  return { success: true };
}
