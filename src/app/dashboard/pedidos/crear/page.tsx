import { createAdminClient } from "@/lib/supabase/server";
import { getDashboardContext } from "@/lib/roles";
import { redirect } from "next/navigation";
import { CrearPedidoClient } from "./CrearPedidoClient";

export default async function CrearPedidoPage() {
  const ctx = await getDashboardContext();
  if (!ctx) redirect("/login");

  const supabase = createAdminClient();

  let clientesQuery = supabase
    .from("clientes")
    .select("id, nombre, telefono, direccion")
    .order("nombre");
  if (ctx.rol === "vendedor" && ctx.vendedorId) {
    clientesQuery = clientesQuery.eq("vendedor_id", ctx.vendedorId);
  }
  const { data: clientes } = await clientesQuery;

  const { data: productos } = await supabase
    .from("productos")
    .select(`
      id,
      nombre,
      aplica_iva,
      iva_porcentaje,
      producto_presentaciones (id, nombre, precio, aplica_iva, iva_porcentaje)
    `)
    .order("nombre");

  return (
    <CrearPedidoClient
      clientes={clientes ?? []}
      productos={(productos ?? []) as Array<{
        id: string;
        nombre: string;
        aplica_iva: boolean;
        iva_porcentaje?: number | null;
        producto_presentaciones: Array<{ id: string; nombre: string; precio: number; aplica_iva: boolean; iva_porcentaje?: number | null }>;
      }>}
    />
  );
}
