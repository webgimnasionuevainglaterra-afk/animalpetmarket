import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { aplicarIva, resolverIvaPorcentaje } from "@/lib/iva";
import { createClient } from "@/lib/supabase/server";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

const IMAGENES_PLACEHOLDER = [
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1444464666168-49d633b63c69?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&h=280&fit=crop",
];

export default async function OfertasPage() {
  const supabase = await createClient();

  const { data: productos } = await supabase
    .from("productos")
    .select(`
      id,
      nombre,
      precio,
      aplica_iva,
      iva_porcentaje,
      imagen,
      porcentaje_oferta,
      producto_presentaciones (id, nombre, precio, porcentaje_oferta, orden, aplica_iva, iva_porcentaje)
    `)
    .order("nombre");

  const productosEnOferta = (productos ?? []).filter((p) => {
    const ofertaProd = p.porcentaje_oferta != null && p.porcentaje_oferta > 0;
    const pps = Array.isArray(p.producto_presentaciones) ? p.producto_presentaciones : p.producto_presentaciones ? [p.producto_presentaciones] : [];
    const ofertaPres = pps.some((pp: { porcentaje_oferta?: number | null }) => pp.porcentaje_oferta != null && pp.porcentaje_oferta > 0);
    return ofertaProd || ofertaPres;
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffeef7,transparent_42%),#fff7ef] text-slate-800">
      <main className="mx-auto w-full max-w-[1260px] px-3 pb-6 pt-3 sm:px-6">
        <Header />

        <section className="mt-6 overflow-hidden rounded-[24px] border border-[#f3dcff] bg-white shadow-[0_22px_52px_rgba(123,31,162,0.12)]">
          <div className="border-b border-slate-100 bg-gradient-to-r from-[#ff6b35] to-[#ff9b23] px-6 py-8 sm:px-8">
            <h1 className="text-3xl font-black text-white sm:text-4xl">
              Ofertas
            </h1>
            <p className="mt-1 text-white/90">
              {productosEnOferta.length} producto(s) en oferta
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {productosEnOferta.length === 0 ? (
              <p className="py-12 text-center text-slate-500">
                No hay productos en oferta en este momento.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {productosEnOferta.map((p, idx) => {
                  const precioBase = typeof p.precio === "string" ? parseFloat(p.precio) : Number(p.precio);
                  const pps = Array.isArray(p.producto_presentaciones) ? p.producto_presentaciones : p.producto_presentaciones ? [p.producto_presentaciones] : [];
                  const ppsOrden = [...pps].sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden);
                  const primeraConOferta = ppsOrden.find((pp: { porcentaje_oferta?: number | null }) => pp.porcentaje_oferta != null && pp.porcentaje_oferta > 0);
                  const ofertaProd = p.porcentaje_oferta != null && p.porcentaje_oferta > 0;
                  const ofertaPorc = primeraConOferta?.porcentaje_oferta ?? (ofertaProd ? p.porcentaje_oferta : 0) ?? 0;
                  const precioRef = primeraConOferta?.precio != null ? Number(primeraConOferta.precio) : precioBase;
                  const ivaPorcentaje = resolverIvaPorcentaje({
                    ivaPorcentaje: (primeraConOferta as { iva_porcentaje?: number | null })?.iva_porcentaje,
                    aplicaIva: (primeraConOferta as { aplica_iva?: boolean })?.aplica_iva,
                    fallbackPorcentaje: (p as { iva_porcentaje?: number | null }).iva_porcentaje,
                    fallbackAplicaIva: (p as { aplica_iva?: boolean }).aplica_iva,
                  });
                  const precioSinIva = ofertaPorc > 0 ? precioRef * (1 - ofertaPorc / 100) : precioRef;
                  const precioFinal = aplicarIva(precioSinIva, ivaPorcentaje);
                  const imagen = p.imagen ?? IMAGENES_PLACEHOLDER[idx % IMAGENES_PLACEHOLDER.length];

                  return (
                    <Link
                      key={p.id}
                      href={`/producto/${p.id}`}
                      className="card-lift overflow-hidden rounded-3xl border border-[#ece2ff] bg-white p-3 shadow-[0_10px_26px_rgba(123,31,162,0.12)]"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
                        {ofertaPorc > 0 && (
                          <span className="absolute left-3 top-3 z-10 rounded-full bg-[#ff6b35] px-3 py-1 text-[10px] font-black text-white">
                            {ofertaPorc}% OFF
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
                            ${aplicarIva(precioRef, ivaPorcentaje).toLocaleString("es-CO")}
                          </span>
                        )}
                        <p className="text-2xl font-black text-[var(--ca-orange)]">
                          ${precioFinal.toLocaleString("es-CO")}
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
        </section>

        <Footer />
      </main>
    </div>
  );
}
