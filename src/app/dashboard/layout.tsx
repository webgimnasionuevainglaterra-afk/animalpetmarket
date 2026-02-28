import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "./DashboardSidebar";

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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />

      <main className="ml-0 flex-1 p-4 pt-16 print:ml-0 print:pt-4 lg:ml-64 lg:pt-6 lg:p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:border-0 print:rounded-none print:shadow-none print:p-0 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
