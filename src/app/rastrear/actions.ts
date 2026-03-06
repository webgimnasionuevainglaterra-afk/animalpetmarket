"use server";

import { createAdminClient } from "@/lib/supabase/server";

export type PedidoRastreo = {
  id: string;
  numero_orden: number | null;
  nombre_cliente: string;
  telefono: string;
  direccion: string;
  notas: string | null;
  total: number;
  estado: string;
  created_at: string;
  items: Array<{
    nombre: string;
    presentacion: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
  fecha_despacho?: string | null;
  entrega_foto_url?: string | null;
};

export type HistorialPedido = {
  id: string;
  numero_orden: number | null;
  total: number;
  estado: string;
  created_at: string;
  fecha_despacho?: string | null;
};

/** Detecta si el input es número de orden (ORD-0001, 1) o teléfono */
function esNumeroOrden(input: string): { esOrden: true; num: number } | { esOrden: false; telefono: string } {
  const limpio = input.trim();
  const soloDigitos = limpio.replace(/\D/g, "");

  // Si empieza con ORD- o es un número corto (1-5 dígitos), es orden
  if (limpio.toUpperCase().startsWith("ORD-")) {
    const parte = limpio.slice(4).trim().replace(/\D/g, "");
    const num = parseInt(parte, 10);
    if (!isNaN(num) && num >= 1) return { esOrden: true, num };
  }
  if (soloDigitos.length <= 5) {
    const num = parseInt(soloDigitos, 10);
    if (!isNaN(num) && num >= 1) return { esOrden: true, num };
  }

  // Si tiene 7+ dígitos, es teléfono
  if (soloDigitos.length >= 7) {
    return { esOrden: false, telefono: soloDigitos };
  }

  // Por defecto intentar como orden si es numérico
  const num = parseInt(soloDigitos, 10);
  if (!isNaN(num) && num >= 1) return { esOrden: true, num };
  return { esOrden: false, telefono: soloDigitos };
}

/** Busca un pedido por número de orden (ORD-0001) o teléfono y devuelve el pedido + historial del cliente */
export async function buscarPedidoPorNumero(
  input: string
): Promise<
  | { success: true; pedido: PedidoRastreo; historial: HistorialPedido[] }
  | { success: false; error: string }
> {
  const valor = input.trim();
  if (!valor) return { success: false, error: "Ingresa tu número de pedido o teléfono" };

  const tipo = esNumeroOrden(valor);
  const supabase = createAdminClient();

  let pedido: {
    id: string;
    numero_orden: number | null;
    nombre_cliente: string;
    telefono: string;
    direccion: string;
    notas: string | null;
    total: number | string;
    estado: string;
    created_at: string;
    cliente_id: string | null;
    entrega_foto_url?: string | null;
  } | null = null;

  if (tipo.esOrden) {
    const { data, error } = await supabase
      .from("pedidos")
      .select(`
        id,
        numero_orden,
        nombre_cliente,
        telefono,
        direccion,
        notas,
        total,
        estado,
        created_at,
        cliente_id,
        entrega_foto_url
      `)
      .eq("numero_orden", tipo.num)
      .single();
    if (error || !data) {
      return { success: false, error: "No encontramos un pedido con ese número de orden" };
    }
    pedido = data;
  } else {
    // Buscar por teléfono (normalizar: solo dígitos)
    const telefonoNorm = valor.replace(/\D/g, "");
    if (telefonoNorm.length < 7) {
      return { success: false, error: "Ingresa un número de pedido (ORD-0001) o teléfono válido" };
    }
    const { data: todos } = await supabase
      .from("pedidos")
      .select(`
        id,
        numero_orden,
        nombre_cliente,
        telefono,
        direccion,
        notas,
        total,
        estado,
        created_at,
        cliente_id,
        entrega_foto_url
      `)
      .neq("estado", "cancelado")
      .order("created_at", { ascending: false });

    const encontrado = (todos ?? []).find((p) => (p.telefono ?? "").replace(/\D/g, "").includes(telefonoNorm) || telefonoNorm.includes((p.telefono ?? "").replace(/\D/g, "")));
    if (!encontrado) {
      return { success: false, error: "No encontramos pedidos con ese teléfono" };
    }
    pedido = encontrado;
  }

  if (!pedido) {
    return { success: false, error: "No encontramos ningún pedido" };
  }

  const { data: items } = await supabase
    .from("pedido_items")
    .select("nombre, presentacion, cantidad, precio_unitario, subtotal")
    .eq("pedido_id", pedido.id)
    .order("created_at");

  const { data: venta } = await supabase
    .from("ventas")
    .select("fecha_venta")
    .eq("pedido_id", pedido.id)
    .single();

  const total = typeof pedido.total === "string" ? parseFloat(pedido.total) : Number(pedido.total);

  const pedidoRastreo: PedidoRastreo = {
    id: pedido.id,
    numero_orden: pedido.numero_orden,
    nombre_cliente: pedido.nombre_cliente,
    telefono: pedido.telefono,
    direccion: pedido.direccion,
    notas: pedido.notas,
    total,
    estado: pedido.estado,
    created_at: pedido.created_at,
    items: (items ?? []).map((i) => ({
      nombre: i.nombre,
      presentacion: i.presentacion,
      cantidad: typeof i.cantidad === "string" ? parseInt(i.cantidad, 10) : i.cantidad,
      precio_unitario: typeof i.precio_unitario === "string" ? parseFloat(i.precio_unitario) : i.precio_unitario,
      subtotal: typeof i.subtotal === "string" ? parseFloat(i.subtotal) : i.subtotal,
    })),
    fecha_despacho: venta?.fecha_venta ?? null,
    entrega_foto_url: pedido.entrega_foto_url ?? null,
  };

  // Historial: todos los pedidos del mismo cliente (por cliente_id o telefono)
  let historialQuery = supabase
    .from("pedidos")
    .select("id, numero_orden, total, estado, created_at")
    .neq("estado", "cancelado")
    .order("created_at", { ascending: false })
    .limit(20);

  if (pedido.cliente_id) {
    historialQuery = historialQuery.eq("cliente_id", pedido.cliente_id);
  } else {
    historialQuery = historialQuery.eq("telefono", pedido.telefono);
  }

  const { data: historialRaw } = await historialQuery;

  const idsHistorial = (historialRaw ?? []).map((p) => p.id);
  let ventasMap: Record<string, string> = {};
  if (idsHistorial.length > 0) {
    const { data: ventas } = await supabase
      .from("ventas")
      .select("pedido_id, fecha_venta")
      .in("pedido_id", idsHistorial);
    ventasMap = (ventas ?? []).reduce(
      (acc, v) => ({ ...acc, [v.pedido_id]: v.fecha_venta }),
      {} as Record<string, string>
    );
  }

  const historial: HistorialPedido[] = (historialRaw ?? []).map((p) => ({
    id: p.id,
    numero_orden: p.numero_orden,
    total: typeof p.total === "string" ? parseFloat(p.total) : Number(p.total),
    estado: p.estado,
    created_at: p.created_at,
    fecha_despacho: ventasMap[p.id] ?? null,
  }));

  return { success: true, pedido: pedidoRastreo, historial };
}
