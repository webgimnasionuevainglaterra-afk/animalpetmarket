"use server";

import {
  isValidUUID,
  sanitizarTexto,
  validarLongitud,
  validarNumero,
} from "@/lib/validations";
import { IVA_OPCIONES, IVA_POR_DEFECTO } from "@/lib/iva";
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
  iva_porcentaje?: number | null;
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
  porcentaje_oferta?: number | null;
  aplica_iva?: boolean | null;
  iva_porcentaje?: number | null;
};

type PresentacionFormInput = {
  id?: string;
  nombre: string;
  imagen: string | null;
  precio: number | null;
  orden: number;
  porcentaje_oferta: number | null;
  aplica_iva: boolean;
  iva_porcentaje: number;
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

function parseIvaPorcentaje(
  valor: FormDataEntryValue | null,
  campo: string
): { ivaPorcentaje: number; aplicaIva: boolean } | { error: string } {
  const texto = String(valor ?? "").trim();
  const porcentaje = texto ? parseInt(texto, 10) : IVA_POR_DEFECTO;
  if (!IVA_OPCIONES.includes(porcentaje as (typeof IVA_OPCIONES)[number])) {
    return { error: `${campo}: selecciona un IVA válido` };
  }
  return { ivaPorcentaje: porcentaje, aplicaIva: porcentaje > 0 };
}

async function extraerPresentacionesDesdeFormData(
  formData: FormData
): Promise<{ presentaciones: PresentacionFormInput[] } | { error: string }> {
  const presentaciones: PresentacionFormInput[] = [];

  for (let i = 0; i < 50; i++) {
    const nombreRaw = formData.get(`presentacion_${i}_nombre`);
    if (nombreRaw === null) break;

    const nombrePres = String(nombreRaw).trim();
    if (!nombrePres) continue;

    const errPresNombre = validarLongitud(nombrePres, MAX_PRESENTACION_NOMBRE);
    if (errPresNombre) return { error: `Presentación ${i + 1}: ${errPresNombre}` };

    const precioVal = formData.get(`presentacion_${i}_precio`) as string;
    const precioPres = precioVal ? parseFloat(precioVal) : null;
    if (precioPres != null && (precioPres < 0 || precioPres > MAX_PRECIO)) {
      return { error: `Presentación "${nombrePres}": precio inválido` };
    }

    const file = formData.get(`presentacion_${i}_imagen`) as File | null;
    let imagen: string | null = null;
    if (file?.size) {
      const res = await subirImagen(file);
      if ("error" in res) return { error: `Presentación ${i + 1} imagen: ${res.error}` };
      if ("url" in res && res.url) imagen = res.url;
    } else {
      const urlExistente = formData.get(`presentacion_${i}_imagen_url`) as string | null;
      imagen = urlExistente?.trim() ? urlExistente : null;
    }

    const idRaw = formData.get(`presentacion_${i}_id`) as string | null;
    const id = idRaw?.trim() ? idRaw : undefined;
    if (id && !isValidUUID(id)) return { error: `Presentación "${nombrePres}": ID inválido` };

    const ivaPresResult = parseIvaPorcentaje(
      formData.get(`presentacion_${i}_iva_porcentaje`),
      `Presentación ${i + 1}`
    );
    if ("error" in ivaPresResult) return ivaPresResult;
    const ofertaPresVal = formData.get(`presentacion_${i}_oferta`) as string;
    const porcentajeOfertaPres = ofertaPresVal ? parseInt(ofertaPresVal, 10) : null;

    presentaciones.push({
      id,
      nombre: sanitizarTexto(nombrePres, MAX_PRESENTACION_NOMBRE),
      imagen,
      precio: precioPres,
      aplica_iva: ivaPresResult.aplicaIva,
      iva_porcentaje: ivaPresResult.ivaPorcentaje,
      porcentaje_oferta:
        porcentajeOfertaPres != null && porcentajeOfertaPres >= 1 && porcentajeOfertaPres <= 99
          ? porcentajeOfertaPres
          : null,
      orden: presentaciones.length,
    });
  }

  return { presentaciones };
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

  const presentacionesResult = await extraerPresentacionesDesdeFormData(formData);
  if ("error" in presentacionesResult) return presentacionesResult;

  const supabase = await createClient();
  const file = formData.get("imagen") as File | null;
  let imagen: string | null = null;
  if (file?.size) {
    const res = await subirImagen(file);
    if ("error" in res) return { error: `Imagen: ${res.error}` };
    imagen = res.url || null;
  }

  const ivaProductoResult = parseIvaPorcentaje(formData.get("iva_porcentaje"), "IVA");
  if ("error" in ivaProductoResult) return ivaProductoResult;
  const aplicaIva = ivaProductoResult.aplicaIva;
  const porcentajeOfertaVal = formData.get("porcentaje_oferta") as string;
  const porcentajeOferta = porcentajeOfertaVal ? parseInt(porcentajeOfertaVal, 10) : null;
  const insert: Record<string, unknown> = {
    nombre: sanitizarTexto(nombre, MAX_NOMBRE),
    descripcion: desc ? sanitizarTexto(desc, MAX_DESCRIPCION) : null,
    precio,
    aplica_iva: aplicaIva,
    iva_porcentaje: ivaProductoResult.ivaPorcentaje,
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

  // Crear presentaciones; si no hay ninguna, crear "Principal" para inventario.
  if (presentacionesResult.presentaciones.length > 0) {
    const { error: errPres } = await supabase.from("producto_presentaciones").insert(
      presentacionesResult.presentaciones.map((presentacion) => ({
        producto_id: productoId,
        nombre: presentacion.nombre,
        imagen: presentacion.imagen,
        precio: presentacion.precio,
        aplica_iva: presentacion.aplica_iva,
        iva_porcentaje: presentacion.iva_porcentaje,
        porcentaje_oferta: presentacion.porcentaje_oferta,
        orden: presentacion.orden,
      }))
    );
    if (errPres) return { error: `Error al crear presentaciones: ${errPres.message}` };
  } else {
    const { error: errPrincipal } = await supabase.from("producto_presentaciones").insert({
      producto_id: productoId,
      nombre: "Principal",
      imagen: null,
      precio,
      aplica_iva: aplicaIva,
      iva_porcentaje: ivaProductoResult.ivaPorcentaje,
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

  const presentacionesResult = await extraerPresentacionesDesdeFormData(formData);
  if ("error" in presentacionesResult) return presentacionesResult;

  const supabase = await createClient();
  const file = formData.get("imagen") as File | null;
  let imagen: string | undefined;
  if (file?.size) {
    const res = await subirImagen(file);
    if ("error" in res) return { error: `Imagen: ${res.error}` };
    if ("url" in res && res.url) imagen = res.url;
  }

  const ivaProductoResult = parseIvaPorcentaje(formData.get("iva_porcentaje"), "IVA");
  if ("error" in ivaProductoResult) return ivaProductoResult;
  const aplicaIva = ivaProductoResult.aplicaIva;
  const porcentajeOfertaVal = formData.get("porcentaje_oferta") as string;
  const porcentajeOferta = porcentajeOfertaVal ? parseInt(porcentajeOfertaVal, 10) : null;
  const update: Record<string, unknown> = {
    nombre: sanitizarTexto(nombre, MAX_NOMBRE),
    descripcion: descUpdate ? sanitizarTexto(descUpdate, MAX_DESCRIPCION) : null,
    precio,
    aplica_iva: aplicaIva,
    iva_porcentaje: ivaProductoResult.ivaPorcentaje,
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

  const { data: presentacionesExistentes, error: errPresentacionesExistentes } = await supabase
    .from("producto_presentaciones")
    .select("id")
    .eq("producto_id", id);
  if (errPresentacionesExistentes) {
    return { error: `Error al consultar presentaciones actuales: ${errPresentacionesExistentes.message}` };
  }

  const idsExistentes = new Set((presentacionesExistentes ?? []).map((p) => p.id));
  const idsConservados = new Set<string>();

  if (presentacionesResult.presentaciones.length === 0) {
    const { data: principalExistente } = await supabase
      .from("producto_presentaciones")
      .select("id")
      .eq("producto_id", id)
      .eq("nombre", "Principal")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (principalExistente?.id) {
      const { error: errPrincipalUpdate } = await supabase
        .from("producto_presentaciones")
        .update({
          nombre: "Principal",
          imagen: null,
          precio,
          aplica_iva: aplicaIva,
          iva_porcentaje: ivaProductoResult.ivaPorcentaje,
          porcentaje_oferta:
            porcentajeOferta != null && porcentajeOferta >= 1 && porcentajeOferta <= 99
              ? porcentajeOferta
              : null,
          orden: 0,
        })
        .eq("id", principalExistente.id)
        .eq("producto_id", id);
      if (errPrincipalUpdate) {
        return { error: `Error al actualizar presentación Principal: ${errPrincipalUpdate.message}` };
      }
      idsConservados.add(principalExistente.id);
    } else {
      const { data: principalInsertada, error: errPrincipal } = await supabase
        .from("producto_presentaciones")
        .insert({
          producto_id: id,
          nombre: "Principal",
          imagen: null,
          precio,
          aplica_iva: aplicaIva,
          iva_porcentaje: ivaProductoResult.ivaPorcentaje,
          porcentaje_oferta:
            porcentajeOferta != null && porcentajeOferta >= 1 && porcentajeOferta <= 99
              ? porcentajeOferta
              : null,
          orden: 0,
        })
        .select("id")
        .single();
      if (errPrincipal) return { error: `Error al crear presentación Principal: ${errPrincipal.message}` };
      if (principalInsertada?.id) idsConservados.add(principalInsertada.id);
    }
  } else {
    for (const presentacion of presentacionesResult.presentaciones) {
      if (presentacion.id && idsExistentes.has(presentacion.id)) {
        const { error: errPresUpdate } = await supabase
          .from("producto_presentaciones")
          .update({
            nombre: presentacion.nombre,
            imagen: presentacion.imagen,
            precio: presentacion.precio,
            aplica_iva: presentacion.aplica_iva,
            iva_porcentaje: presentacion.iva_porcentaje,
            porcentaje_oferta: presentacion.porcentaje_oferta,
            orden: presentacion.orden,
          })
          .eq("id", presentacion.id)
          .eq("producto_id", id);
        if (errPresUpdate) {
          return { error: `Error al actualizar presentación "${presentacion.nombre}": ${errPresUpdate.message}` };
        }
        idsConservados.add(presentacion.id);
      } else {
        const { data: presentacionInsertada, error: errPresInsert } = await supabase
          .from("producto_presentaciones")
          .insert({
            producto_id: id,
            nombre: presentacion.nombre,
            imagen: presentacion.imagen,
            precio: presentacion.precio,
            aplica_iva: presentacion.aplica_iva,
            iva_porcentaje: presentacion.iva_porcentaje,
            porcentaje_oferta: presentacion.porcentaje_oferta,
            orden: presentacion.orden,
          })
          .select("id")
          .single();
        if (errPresInsert) {
          return { error: `Error al crear presentación "${presentacion.nombre}": ${errPresInsert.message}` };
        }
        if (presentacionInsertada?.id) idsConservados.add(presentacionInsertada.id);
      }
    }
  }

  const idsAEliminar = [...idsExistentes].filter((presentacionId) => !idsConservados.has(presentacionId));
  if (idsAEliminar.length > 0) {
    const { error: errDel } = await supabase.from("producto_presentaciones").delete().in("id", idsAEliminar);
    if (errDel) return { error: `Error al eliminar presentaciones removidas: ${errDel.message}` };
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
