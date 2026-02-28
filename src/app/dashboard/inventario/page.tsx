import { createClient } from "@/lib/supabase/server";
import { InventarioClient } from "./InventarioClient";
import { asegurarPresentacionesPrincipales } from "./actions";

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ foco?: string }>;
}) {
  const { foco } = await searchParams;
  const supabase = await createClient();

  // Crear "Principal" para productos sin presentación (para que aparezcan en el dropdown)
  await asegurarPresentacionesPrincipales();

  const { data: presentaciones } = await supabase
    .from("producto_presentaciones")
    .select(`
      id,
      nombre,
      producto_id,
      productos (id, nombre)
    `)
    .order("nombre");

  const { data: lotes } = await supabase
    .from("inventario_lotes")
    .select(`
      id,
      lote,
      cantidad,
      fecha_vencimiento,
      created_at,
      producto_presentacion_id,
      producto_presentaciones (
        id,
        nombre,
        productos (id, nombre)
      )
    `)
    .order("fecha_vencimiento", { ascending: true });

  return (
    <InventarioClient
      presentaciones={presentaciones ?? []}
      lotes={lotes ?? []}
      focoPresentacionId={foco ?? null}
    />
  );
}
