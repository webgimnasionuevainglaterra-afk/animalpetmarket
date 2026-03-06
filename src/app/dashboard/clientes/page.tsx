import { createAdminClient } from "@/lib/supabase/server";
import { getDashboardContext } from "@/lib/roles";
import { redirect } from "next/navigation";
import { ClientesClient } from "./ClientesClient";

export type ClienteConEstadisticas = {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string | null;
  created_at: string;
  pedidos: number;
  total_comprado: number;
};

export default async function ClientesPage() {
  const ctx = await getDashboardContext();
  if (!ctx) redirect("/login");

  const supabase = createAdminClient();
  let query = supabase
    .from("clientes")
    .select("id, nombre, telefono, direccion, created_at")
    .order("nombre");

  if (ctx.rol === "vendedor" && ctx.vendedorId) {
    query = query.eq("vendedor_id", ctx.vendedorId);
  }

  const { data: clientes } = await query;

  const { data: ventas } = await supabase
    .from("ventas")
    .select("pedido_id, total");

  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("id, cliente_id, telefono");

  const totalPorPedido = new Map(
    (ventas ?? []).map((v) => [v.pedido_id, typeof v.total === "string" ? parseFloat(v.total) : Number(v.total)])
  );

  const pedidosPorClienteId = new Map<string, { pedidos: number; total: number }>();
  const pedidosPorTelefono = new Map<string, { pedidos: number; total: number }>();
  (pedidos ?? []).forEach((p) => {
    const totalVenta = totalPorPedido.get(p.id) ?? 0;
    if (p.cliente_id) {
      const k = String(p.cliente_id);
      if (!pedidosPorClienteId.has(k)) pedidosPorClienteId.set(k, { pedidos: 0, total: 0 });
      const c = pedidosPorClienteId.get(k)!;
      c.pedidos++;
      c.total += totalVenta;
    } else if (p.telefono) {
      const k = p.telefono;
      if (!pedidosPorTelefono.has(k)) pedidosPorTelefono.set(k, { pedidos: 0, total: 0 });
      const c = pedidosPorTelefono.get(k)!;
      c.pedidos++;
      c.total += totalVenta;
    }
  });

  const clientesConEstadisticas: ClienteConEstadisticas[] = (clientes ?? []).map((c) => {
    const porId = pedidosPorClienteId.get(c.id);
    const porTel = pedidosPorTelefono.get(c.telefono);
    const stats = porId ?? porTel ?? { pedidos: 0, total: 0 };
    return {
      ...c,
      pedidos: stats.pedidos,
      total_comprado: stats.total,
    };
  });

  return (
    <ClientesClient clientes={clientesConEstadisticas} />
  );
}
