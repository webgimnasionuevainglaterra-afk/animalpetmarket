import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { FacturaPrint } from "@/components/FacturaPrint";

export default async function FacturaPublicaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token?.trim()) notFound();

  const supabase = createAdminClient();

  const { data: pedido } = await supabase
    .from("pedidos")
    .select(
      `
      id,
      numero_orden,
      nombre_cliente,
      telefono,
      direccion,
      notas,
      total,
      estado,
      created_at,
      token_factura,
      pedido_items (nombre, presentacion, cantidad, precio_unitario, subtotal, aplica_iva)
    `
    )
    .eq("id", id)
    .single();

  if (!pedido || pedido.token_factura !== token.trim()) notFound();

  const { token_factura: _, ...pedidoSinToken } = pedido;
  return <FacturaPrint pedido={pedidoSinToken} standalone />;
}
