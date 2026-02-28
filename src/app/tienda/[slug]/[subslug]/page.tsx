import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

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

export default async function TiendaSubcategoriaPage({
  params,
}: {
  params: Promise<{ slug: string; subslug: string }>;
}) {
  const { slug, subslug } = await params;
  const supabase = await createClient();

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nombre")
    .order("nombre");

  const categoria = categorias?.find((c) => toSlug(c.nombre) === slug);
  if (!categoria) notFound();

  const { data: subcategorias } = await supabase
    .from("subcategorias")
    .select("id, nombre")
    .eq("categoria_id", categoria.id)
    .order("nombre");

  const subcategoria = subcategorias?.find((s) => toSlug(s.nombre) === subslug);
  if (!subcategoria) notFound();

  const { data: productos } = await supabase
    .from("productos")
    .select("id, nombre, precio, aplica_iva, imagen, destacado, nuevo, mas_vendido, porcentaje_oferta, producto_presentaciones (precio, porcentaje_oferta, orden, aplica_iva)")
    .eq("subcategoria_id", subcategoria.id)
    .order("nombre");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffeef7,transparent_42%),#fff7ef] text-slate-800">
      <main className="mx-auto w-full max-w-[1260px] px-3 pb-6 pt-3 sm:px-6">
        <div className="rounded-xl bg-[var(--ca-purple)] px-4 py-2.5 text-white shadow-md">
          <div className="flex flex-col items-center justify-between gap-1 text-sm font-medium sm:flex-row sm:text-base">
            <span>Envío rápido y seguro</span>
            <span>311 234 5678</span>
          </div>
        </div>

        <Header />

        <section className="mt-6">
          <Link
            href={`/tienda/${slug}`}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--ca-purple)] hover:underline"
          >
            <ArrowLeft size={18} />
            Volver a {categoria.nombre}
          </Link>

          <div className="overflow-hidden rounded-[24px] border border-[#f3dcff] bg-white shadow-[0_22px_52px_rgba(123,31,162,0.12)]">
            <div className="border-b border-slate-100 bg-gradient-to-r from-[#fef3fb] to-[#fff9f0] px-6 py-6 sm:px-8">
              <h1 className="text-3xl font-black text-[var(--ca-purple)] sm:text-4xl">
                {categoria.nombre} → {subcategoria.nombre}
              </h1>
              <p className="mt-1 text-slate-600">
                {productos?.length ?? 0} producto(s) en esta subcategoría
              </p>
            </div>

            <div className="p-6 sm:p-8">
              {!productos?.length ? (
                <p className="py-12 text-center text-slate-500">
                  No hay productos en esta subcategoría aún.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {productos.map((p) => {
                    const precioBase = typeof p.precio === "string" ? parseFloat(p.precio) : Number(p.precio);
                    const pps = Array.isArray(p.producto_presentaciones) ? p.producto_presentaciones : p.producto_presentaciones ? [p.producto_presentaciones] : [];
                    const primeraConOferta = [...pps].sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden).find((pp: { porcentaje_oferta?: number | null }) => pp.porcentaje_oferta != null && pp.porcentaje_oferta > 0);
                    const ofertaProd = p.porcentaje_oferta != null && p.porcentaje_oferta > 0;
                    const ofertaPorc = Number(primeraConOferta?.porcentaje_oferta ?? (ofertaProd ? p.porcentaje_oferta : 0) ?? 0);
                    const precioRef = primeraConOferta?.precio != null ? Number(primeraConOferta.precio) : precioBase;
                    const aplicaIva = (primeraConOferta as { aplica_iva?: boolean })?.aplica_iva ?? (p as { aplica_iva?: boolean }).aplica_iva !== false;
                    const precioSinIva = ofertaPorc > 0 ? precioRef * (1 - ofertaPorc / 100) : precioRef;
                    const precioNum = aplicaIva ? precioSinIva * 1.19 : precioSinIva;
                    const imagen =
                      p.imagen ??
                      IMAGENES_PLACEHOLDER[productos.indexOf(p) % IMAGENES_PLACEHOLDER.length];
                    const badge = ofertaPorc > 0
                      ? `${ofertaPorc}% OFF`
                      : p.mas_vendido
                        ? "Más vendido"
                        : p.nuevo
                          ? "Nuevo"
                          : p.destacado
                            ? "Destacado"
                            : null;
                    return (
                      <Link
                        key={p.id}
                        href={`/producto/${p.id}`}
                        className="card-lift overflow-hidden rounded-3xl border border-[#ece2ff] bg-white p-3 shadow-[0_10px_26px_rgba(123,31,162,0.12)]"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
                          {badge && (
                            <span className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-[10px] font-black text-white ${badge.includes("%") ? "bg-[#ff6b35]" : "bg-[#63c132]"}`}>
                              {badge}
                            </span>
                          )}
                          <img
                            src={imagen}
                            alt={p.nombre}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <h3 className="mt-3 line-clamp-2 text-base font-bold text-slate-800">
                          {p.nombre}
                        </h3>
                        <div className="mt-1 flex items-center gap-2">
                          {ofertaPorc > 0 && (
                            <span className="text-sm text-slate-500 line-through">
                              ${(aplicaIva ? precioRef * 1.19 : precioRef).toLocaleString("es-CO")}
                            </span>
                          )}
                          <p className="text-2xl font-black text-[var(--ca-orange)]">
                            ${precioNum.toLocaleString("es-CO")}
                          </p>
                        </div>
                        <div className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--ca-orange)] to-[#ff9b23] px-4 py-2 text-sm font-bold text-white transition hover:brightness-105">
                          <ShoppingCart size={15} />
                          Ver producto
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
