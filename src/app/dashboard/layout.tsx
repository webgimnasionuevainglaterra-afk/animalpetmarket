import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/roles";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "./DashboardSidebar";
import { VendedorRouteGuard } from "./VendedorRouteGuard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const perfil = await getPerfil(data.user.id);
  if (!perfil) {
    redirect("/login");
  }

  const rol = perfil.rol as "admin" | "vendedor" | "domiciliario";
  const vendedorId = perfil.vendedor_id;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar rol={rol} vendedorId={vendedorId} />

      <main className="ml-0 flex-1 p-4 pt-16 print:ml-0 print:pt-4 lg:ml-64 lg:pt-6 lg:p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:border-0 print:rounded-none print:shadow-none print:p-0 lg:p-6">
          <VendedorRouteGuard rol={rol}>{children}</VendedorRouteGuard>
        </div>
      </main>
    </div>
  );
}
