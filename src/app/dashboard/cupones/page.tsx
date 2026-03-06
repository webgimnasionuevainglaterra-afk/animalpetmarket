import { createAdminClient } from "@/lib/supabase/server";
import { CuponesClient } from "./CuponesClient";

export default async function CuponesPage() {
  const supabase = createAdminClient();

  const { data: cupones } = await supabase
    .from("cupones")
    .select("id, codigo, porcentaje, usado, pedido_id, valido_hasta, created_at")
    .order("created_at", { ascending: false });

  return (
    <CuponesClient cupones={cupones ?? []} />
  );
}
