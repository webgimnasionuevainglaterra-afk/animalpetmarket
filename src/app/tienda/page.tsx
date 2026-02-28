import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const IMAGENES_PLACEHOLDER = [
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1444464666168-49d633b63c69?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&h=280&fit=crop",
];

function toSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default async function TiendaPage() {
  const supabase = await createClient();
  const { data: categoriasDb } = await supabase
    .from("categorias")
    .select("id, nombre, imagen")
    .order("nombre");

  const categorias = (categoriasDb ?? []).map((cat, i) => ({
    id: cat.id,
    nombre: cat.nombre,
    slug: toSlug(cat.nombre),
    imagen: cat.imagen ?? IMAGENES_PLACEHOLDER[i % IMAGENES_PLACEHOLDER.length],
  }));

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffeef7,transparent_42%),#fff7ef] text-slate-800">
      <main className="mx-auto w-full max-w-[1260px] px-3 pb-6 pt-3 sm:px-6">
        <Header />

        <section className="mt-6 overflow-hidden rounded-[24px] border border-[#f3dcff] bg-white shadow-[0_22px_52px_rgba(123,31,162,0.12)]">
          <div className="border-b border-slate-100 bg-gradient-to-r from-[#fef3fb] to-[#fff9f0] px-6 py-8 sm:px-8">
            <h1 className="text-3xl font-black text-[var(--ca-purple)] sm:text-4xl">
              Tienda
            </h1>
            <p className="mt-1 text-slate-600">
              Explora nuestras categorías
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {categorias.length === 0 ? (
              <p className="py-12 text-center text-slate-500">
                No hay categorías aún.
              </p>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
                {categorias.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/tienda/${cat.slug}`}
                    className="card-lift group flex flex-col items-center gap-3"
                  >
                    <div className="relative h-28 w-28 overflow-hidden rounded-full shadow-[0_8px_24px_rgba(123,31,162,0.2)] sm:h-36 sm:w-36">
                      <img
                        src={cat.imagen}
                        alt={cat.nombre}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-[var(--ca-purple)]/80 via-transparent to-transparent" />
                    </div>
                    <span className="text-center text-sm font-bold text-slate-800 sm:text-base">
                      {cat.nombre}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
