"use server";

import {
  isValidUUID,
  sanitizarTexto,
  validarLongitud,
  validarTelefono,
} from "@/lib/validations";
import { createAdminClient, requireAuth } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/roles";
import { revalidatePath } from "next/cache";

const MAX_NOMBRE = 120;
const MAX_DIRECCION = 300;
const MAX_NOTAS = 500;

export type CartItemInput = {
  productId: string;
  nombre: string;
  presentacion: string;
  precio: number;
  cantidad: number;
  aplica_iva?: boolean;
};

const IVA_PORCENTAJE = 19;

type PrecioYStock = {
  precio: number;
  aplica_iva: boolean;
  nombre: string;
  productoPresentacionId: string | null;
};

/** Obtiene el precio real, aplica_iva y el id de presentación desde la BD. */
async function obtenerPrecioYPresentacion(
  supabase: ReturnType<typeof createAdminClient>,
  productId: string,
  presentacion: string
): Promise<PrecioYStock | null> {
  const { data: pp } = await supabase
    .from("producto_presentaciones")
    .select("id, precio, aplica_iva, productos(nombre, aplica_iva)")
    .eq("producto_id", productId)
    .eq("nombre", presentacion)
    .single();

  const nombreProd = pp ? (pp.productos as { nombre?: string } | null)?.nombre ?? "" : "";
  const ppId = pp?.id ?? null;
  const prodAplicaIva = pp ? (pp.productos as { aplica_iva?: boolean } | null)?.aplica_iva !== false : true;

  if (pp?.precio != null) {
    const p = typeof pp.precio === "string" ? parseFloat(pp.precio) : Number(pp.precio);
    const aplicaIva = pp.aplica_iva != null ? !!pp.aplica_iva : prodAplicaIva;
    return { precio: p, aplica_iva: aplicaIva, nombre: nombreProd, productoPresentacionId: ppId };
  }

  const { data: prod } = await supabase
    .from("productos")
    .select("precio, nombre, aplica_iva")
    .eq("id", productId)
    .single();

  if (prod?.precio != null) {
    const p = typeof prod.precio === "string" ? parseFloat(prod.precio) : Number(prod.precio);
    const aplicaIva = (prod as { aplica_iva?: boolean }).aplica_iva !== false;
    return { precio: p, aplica_iva: aplicaIva, nombre: prod.nombre ?? nombreProd, productoPresentacionId: ppId };
  }

  return null;
}

/** Stock disponible (solo lotes no vencidos) para una presentación. */
async function obtenerStockDisponible(
  supabase: ReturnType<typeof createAdminClient>,
  productoPresentacionId: string
): Promise<number> {
  const hoy = new Date().toISOString().slice(0, 10);
  const { data: lotes } = await supabase
    .from("inventario_lotes")
    .select("cantidad")
    .eq("producto_presentacion_id", productoPresentacionId)
    .gte("fecha_vencimiento", hoy)
    .gte("cantidad", 1);

  const total =
    lotes?.reduce(
      (sum, l) => sum + (typeof l.cantidad === "string" ? parseInt(l.cantidad, 10) : l.cantidad),
      0
    ) ?? 0;
  return total;
}

/** Valida un cupón y devuelve el porcentaje si es válido */
export async function validarCupon(codigo: string): Promise<
  | { valid: true; porcentaje: number }
  | { valid: false; error: string }
> {
  const c = (codigo ?? "").trim().toUpperCase();
  if (!c) return { valid: false, error: "Ingresa un código" };
  const supabase = createAdminClient();
  const hoy = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("cupones")
    .select("id, porcentaje, usado, valido_hasta")
    .ilike("codigo", c)
    .limit(1)
    .maybeSingle();
  if (!data) return { valid: false, error: "Cupón no encontrado" };
  if (data.usado) return { valid: false, error: "Cupón ya utilizado" };
  if (data.valido_hasta && data.valido_hasta < hoy) return { valid: false, error: "Cupón expirado" };
  return { valid: true, porcentaje: data.porcentaje };
}

export async function crearPedido(
  nombre: string,
  telefono: string,
  direccion: string,
  notas: string | null,
  items: CartItemInput[],
  _totalCliente: number,
  cuponCodigo: string | null,
  vendedorId?: string | null
) {
  if (!nombre?.trim()) return { error: "El nombre es obligatorio" };
  if (!telefono?.trim()) return { error: "El teléfono es obligatorio" };
  if (!direccion?.trim()) return { error: "La dirección es obligatoria" };
  if (!items?.length) return { error: "El carrito está vacío" };

  const errNombre = validarLongitud(nombre, MAX_NOMBRE);
  if (errNombre) return { error: `Nombre: ${errNombre}` };
  const errTel = validarTelefono(telefono);
  if (errTel) return { error: errTel };
  const errDir = validarLongitud(direccion, MAX_DIRECCION);
  if (errDir) return { error: `Dirección: ${errDir}` };
  if (notas?.trim()) {
    const errNotas = validarLongitud(notas, MAX_NOTAS, 0);
    if (errNotas) return { error: `Notas: ${errNotas}` };
  }

  const supabase = createAdminClient();

  const itemsValidados: Array<{
    productId: string;
    nombre: string;
    presentacion: string;
    precio: number;
    cantidad: number;
    aplica_iva: boolean;
  }> = [];

  for (const item of items) {
    if (!isValidUUID(item.productId)) {
      return { error: `Producto inválido en el carrito` };
    }
    if (item.cantidad < 1 || item.cantidad > 999) {
      return { error: `Cantidad inválida para "${item.nombre}"` };
    }
    const info = await obtenerPrecioYPresentacion(supabase, item.productId, item.presentacion);
    if (!info) {
      return { error: `Producto "${item.nombre}" (${item.presentacion}) no encontrado o sin precio` };
    }
    if (item.cantidad < 1) continue;

    if (info.productoPresentacionId) {
      const stock = await obtenerStockDisponible(supabase, info.productoPresentacionId);
      if (stock < item.cantidad) {
        return {
          error: `Stock insuficiente de "${info.nombre}" (${item.presentacion}). Disponible: ${stock}, solicitado: ${item.cantidad}`,
        };
      }
    }

    const precioFinal = info.aplica_iva ? info.precio * (1 + IVA_PORCENTAJE / 100) : info.precio;
    itemsValidados.push({
      productId: item.productId,
      nombre: info.nombre || item.nombre,
      presentacion: item.presentacion,
      precio: precioFinal,
      cantidad: item.cantidad,
      aplica_iva: info.aplica_iva,
    });
  }

  if (itemsValidados.length === 0) return { error: "El carrito está vacío" };

  const total = itemsValidados.reduce(
    (sum, i) => sum + i.precio * i.cantidad,
    0
  );

  const itemsParaRpc = itemsValidados.map((i) => ({
    producto_id: i.productId,
    nombre: i.nombre,
    presentacion: i.presentacion,
    cantidad: i.cantidad,
    precio_unitario: i.precio,
    aplica_iva: i.aplica_iva,
  }));

  const cupon = (cuponCodigo ?? "").trim() || null;

  const { data: pedidoId, error: errRpc } = await supabase.rpc("crear_pedido_transaccional", {
    p_nombre_cliente: sanitizarTexto(nombre, MAX_NOMBRE),
    p_telefono: sanitizarTexto(telefono, 20),
    p_direccion: sanitizarTexto(direccion, MAX_DIRECCION),
    p_notas: notas ? sanitizarTexto(notas, MAX_NOTAS) : "",
    p_total: total,
    p_items: itemsParaRpc,
    p_cupon_codigo: cupon,
    p_vendedor_id: vendedorId ?? null,
  });

  if (errRpc) return { error: errRpc.message };
  if (!pedidoId) return { error: "No se pudo crear el pedido" };

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("numero_orden, token_factura")
    .eq("id", pedidoId)
    .single();

  const numeroOrden = pedido?.numero_orden != null
    ? `ORD-${String(pedido.numero_orden).padStart(4, "0")}`
    : null;

  revalidatePath("/dashboard/pedidos");
  return { success: true, pedidoId, numeroOrden, tokenFactura: pedido?.token_factura ?? null };
}

/** Crea un pedido desde el dashboard (vendedor o admin). Si es vendedor, asocia vendedor_id. */
export async function crearPedidoDesdeDashboard(
  nombre: string,
  telefono: string,
  direccion: string,
  notas: string | null,
  items: CartItemInput[],
  cuponCodigo: string | null
) {
  const auth = await requireAuth();
  if (auth.error) return auth;

  const perfil = await getPerfil(auth.user!.id);
  const vendedorId = perfil?.rol === "vendedor" ? perfil.vendedor_id : null;

  return crearPedido(nombre, telefono, direccion, notas, items, 0, cuponCodigo, vendedorId);
}

export type PedidoResumen = {
  id: string;
  numero_orden: number | null;
  estado: string;
  nombre_cliente: string;
  telefono: string;
  direccion: string;
  notas: string | null;
  total: number;
  created_at: string;
  token_factura: string | null | undefined;
  pedido_items: { nombre: string; presentacion: string; cantidad: number; precio_unitario: number; subtotal: number }[];
};

/** Obtiene un pedido por ID (ruta pública, sin auth). */
export async function obtenerPedidoPorId(pedidoId: string): Promise<PedidoResumen | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("pedidos")
    .select(
      `
      id,
      numero_orden,
      estado,
      nombre_cliente,
      telefono,
      direccion,
      notas,
      total,
      created_at,
      token_factura,
      pedido_items (nombre, presentacion, cantidad, precio_unitario, subtotal, aplica_iva)
    `
    )
    .eq("id", pedidoId)
    .single();

  return data as PedidoResumen | null;
}
