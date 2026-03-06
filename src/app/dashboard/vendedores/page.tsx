import { createAdminClient } from "@/lib/supabase/server";
import { getDashboardContext } from "@/lib/roles";
import { redirect } from "next/navigation";
import { VendedoresClient } from "./VendedoresClient";

export default async function VendedoresPage() {
  const ctx = await getDashboardContext();
  if (!ctx) redirect("/login");
  if (ctx.rol !== "admin") redirect("/dashboard");

  const supabase = createAdminClient();
  const { data: vendedores } = await supabase
    .from("vendedores")
    .select("id, nombre, email, porcentaje_comision, activo, created_at")
    .order("nombre");

  return <VendedoresClient vendedores={vendedores ?? []} />;
}
