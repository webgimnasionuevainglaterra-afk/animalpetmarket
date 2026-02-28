import { createClient } from "@/lib/supabase/server";
import { PedidosClient } from "./PedidosClient";

export default async function PedidosPage() {
  const supabase = await createClient();

  const [{ data: pedidos }, { data: ventas }] = await Promise.all([
    supabase
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
        pedido_items (
          producto_id,
          nombre,
          presentacion,
          cantidad,
          precio_unitario,
          subtotal
        )
      `)
      .order("created_at", { ascending: false }),
    supabase.from("ventas").select("pedido_id, fecha_venta"),
  ]);

  const ventasPorPedido = (ventas ?? []).reduce(
    (acc, v) => {
      acc[v.pedido_id] = { fecha_venta: v.fecha_venta };
      return acc;
    },
    {} as Record<string, { fecha_venta: string }>
  );

  const pedidosConVenta = (pedidos ?? []).map((p) => ({
    ...p,
    ventas: ventasPorPedido[p.id] ? [ventasPorPedido[p.id]] : null,
  }));

  return <PedidosClient pedidos={pedidosConVenta} />;
}
