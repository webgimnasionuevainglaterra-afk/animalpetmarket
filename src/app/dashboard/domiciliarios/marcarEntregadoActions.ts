"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getDashboardContext } from "@/lib/roles";
import { revalidatePath } from "next/cache";

const BUCKET = "entrega-fotos";

export async function marcarEntregado(pedidoId: string, total: number, fotoFile: File) {
  const ctx = await getDashboardContext();
  if (!ctx || ctx.rol !== "domiciliario" || !ctx.domiciliarioId) {
    return { error: "No autorizado" };
  }

  const supabase = createAdminClient();

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, domiciliario_id, estado")
    .eq("id", pedidoId)
    .single();

  if (!pedido || pedido.domiciliario_id !== ctx.domiciliarioId) {
    return { error: "Pedido no asignado a ti" };
  }
  if (pedido.estado === "entregado") {
    return { error: "Este pedido ya fue marcado como entregado" };
  }

  // Si no está despachado, ejecutar lógica de despacho (venta, inventario) primero
  if (pedido.estado !== "despachado") {
    const { error: rpcError } = await supabase.rpc("marcar_despachado_transaccional", {
      p_pedido_id: pedidoId,
      p_total: total,
      p_domiciliario_id: ctx.domiciliarioId,
    });
    if (rpcError) return { error: rpcError.message };
  }

  const ext = fotoFile.name.split(".").pop() || "jpg";
  const path = `${pedidoId}/${Date.now()}.${ext}`;

  const arrayBuffer = await fotoFile.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: fotoFile.type,
    upsert: true,
  });

  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const fotoUrl = urlData.publicUrl;

  const { error: updateError } = await supabase
    .from("pedidos")
    .update({
      estado: "entregado",
      entrega_foto_url: fotoUrl,
    })
    .eq("id", pedidoId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/dashboard");
  return { success: true };
}
