import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PedidoConfirmacion } from "./PedidoConfirmacion";

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: pedido } = await supabase
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
      pedido_items (nombre, presentacion, cantidad, precio_unitario, subtotal)
    `
    )
    .eq("id", id)
    .single();

  if (!pedido) notFound();

  return <PedidoConfirmacion pedido={pedido} />;
}
