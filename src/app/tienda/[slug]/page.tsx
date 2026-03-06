import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

function toSlug(nombre: string) {
  return nombre
    .toLowerCase()
    .replace(/\s+/g, "-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default async function TiendaCategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nombre, imagen")
    .order("nombre");

  const categoria = categorias?.find((c) => toSlug(c.nombre) === slug);
  if (!categoria) notFound();

  const { data: subcategorias } = await supabase
    .from("subcategorias")
    .select("id, nombre")
    .eq("categoria_id", categoria.id)
    .order("nombre");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffeef7,transparent_42%),#fff7ef] text-slate-800">
      <main className="mx-auto w-full max-w-[1260px] px-3 pb-6 pt-3 sm:px-6">
        <TopBar />

        <Header />

        <section className="mt-6">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--ca-purple)] hover:underline"
          >
            <ArrowLeft size={18} />
            Volver al inicio
          </Link>

          <div className="overflow-hidden rounded-[24px] border border-[#f3dcff] bg-white shadow-[0_22px_52px_rgba(123,31,162,0.12)]">
            <div className="border-b border-slate-100 bg-gradient-to-r from-[#fef3fb] to-[#fff9f0] px-6 py-6 sm:px-8">
              <h1 className="text-3xl font-black text-[var(--ca-purple)] sm:text-4xl">
                {categoria.nombre}
              </h1>
              <p className="mt-1 text-slate-600">
                Elige una subcategoría para ver los productos
              </p>
            </div>

            <div className="p-6 sm:p-8">
              {!subcategorias?.length ? (
                <p className="py-12 text-center text-slate-500">
                  Aún no hay subcategorías. Pronto agregaremos productos aquí.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {subcategorias.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/tienda/${slug}/${toSlug(sub.nombre)}`}
                      className="card-lift flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-[var(--ca-purple)]/30 hover:shadow-md"
                    >
                      <span className="font-bold text-slate-800">
                        {sub.nombre}
                      </span>
                      <ChevronRight
                        size={20}
                        className="text-[var(--ca-purple)]"
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
