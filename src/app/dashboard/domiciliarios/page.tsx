import { createAdminClient } from "@/lib/supabase/server";
import { getDashboardContext } from "@/lib/roles";
import { redirect } from "next/navigation";
import { DomiciliariosClient } from "./DomiciliariosClient";

export default async function DomiciliariosPage() {
  const ctx = await getDashboardContext();
  if (!ctx) redirect("/login");
  if (ctx.rol !== "admin") redirect("/dashboard");

  const supabase = createAdminClient();
  const { data: domiciliarios } = await supabase
    .from("domiciliarios")
    .select("id, nombre, placa, telefono, activo, created_at")
    .order("nombre");

  return <DomiciliariosClient domiciliarios={domiciliarios ?? []} />;
}
