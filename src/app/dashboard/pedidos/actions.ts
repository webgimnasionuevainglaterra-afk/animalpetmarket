"use server";

import { isValidUUID } from "@/lib/validations";
import { createAdminClient, requireAuth } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function marcarPendiente(pedidoId: string) {
  const auth = await requireAuth();
  if (auth.error) return auth;
  if (!isValidUUID(pedidoId)) return { error: "Pedido inválido" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("pedidos")
    .update({ estado: "pendiente" })
    .eq("id", pedidoId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/pedidos");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function marcarDespachado(pedidoId: string, total: number) {
  const auth = await requireAuth();
  if (auth.error) return auth;
  if (!isValidUUID(pedidoId)) return { error: "Pedido inválido" };

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("marcar_despachado_transaccional", {
    p_pedido_id: pedidoId,
    p_total: total,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/pedidos");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventario");
  revalidatePath("/dashboard/productos");
  return { success: true };
}

export async function rechazarPedido(pedidoId: string) {
  const auth = await requireAuth();
  if (auth.error) return auth;
  if (!isValidUUID(pedidoId)) return { error: "Pedido inválido" };

  const supabase = createAdminClient();

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("estado")
    .eq("id", pedidoId)
    .single();

  if (pedido?.estado === "despachado") {
    await supabase.from("ventas").delete().eq("pedido_id", pedidoId);

    const { data: items } = await supabase
      .from("pedido_items")
      .select("producto_id, presentacion, cantidad")
      .eq("pedido_id", pedidoId);

    const vencDevolucion = new Date();
    vencDevolucion.setMonth(vencDevolucion.getMonth() + 6);
    const fechaDev = vencDevolucion.toISOString().slice(0, 10);

    if (items?.length) {
      for (const item of items) {
        if (!item.producto_id) continue;
        const cant = typeof item.cantidad === "string" ? parseInt(item.cantidad, 10) : item.cantidad;
        const { data: pp } = await supabase
          .from("producto_presentaciones")
          .select("id")
          .eq("producto_id", item.producto_id)
          .eq("nombre", item.presentacion)
          .single();
        if (!pp?.id) continue;

        await supabase.from("inventario_lotes").insert({
          producto_presentacion_id: pp.id,
          lote: `DEV-${pedidoId.slice(0, 8)}`,
          cantidad: cant,
          fecha_vencimiento: fechaDev,
        });
      }
    }
  }

  const { error } = await supabase.from("pedidos").delete().eq("id", pedidoId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/pedidos");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventario");
  revalidatePath("/dashboard/productos");
  return { success: true };
}
