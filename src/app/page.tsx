import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import { PedidoSuccessBanner } from "@/components/PedidoSuccessBanner";
import { RastrearPedido } from "@/components/RastrearPedido";
import { createClient } from "@/lib/supabase/server";
import { aplicarIva, resolverIvaPorcentaje } from "@/lib/iva";
import { Suspense } from "react";
import Link from "next/link";
import { WhatsAppFloatingButton } from "@/components/WhatsAppFloatingButton";
import {
  PackageCheck,
  PawPrint,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";

// Imágenes placeholder por ciclo (cuando no hay imagen en BD)
const IMAGENES_PLACEHOLDER = [
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1444464666168-49d633b63c69?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&h=280&fit=crop",
];

export default async function Home() {
  const supabase = await createClient();

  let categoriasDb: { id: string; nombre: string; imagen: string | null }[] | null = null;
  let productosDestacados: {
    id: string;
    nombre: string;
    precio: number | string;
    imagen: string | null;
    mas_vendido: boolean;
    nuevo: boolean;
    porcentaje_oferta?: number | null;
    iva_porcentaje?: number | null;
    producto_presentaciones?: { precio?: number | null; porcentaje_oferta?: number | null; orden?: number; aplica_iva?: boolean; iva_porcentaje?: number | null } | { precio?: number | null; porcentaje_oferta?: number | null; orden?: number; aplica_iva?: boolean; iva_porcentaje?: number | null }[];
    subcategorias?: { nombre: string; categorias?: { nombre: string } } | { nombre: string; categorias?: { nombre: string } }[];
  }[] = [];

  let productosEnOferta: typeof productosDestacados = [];
  const SUPABASE_TIMEOUT_MS = 10000;
  try {
    const queries = Promise.all([
      supabase
        .from("categorias")
        .select("id, nombre, imagen")
        .order("nombre"),
      supabase
        .from("productos")
        .select("id, nombre, precio, aplica_iva, iva_porcentaje, imagen, mas_vendido, nuevo, porcentaje_oferta, producto_presentaciones (precio, porcentaje_oferta, orden, aplica_iva, iva_porcentaje), subcategorias (nombre, categorias (nombre))")
        .eq("destacado", true)
        .order("nombre")
        .limit(12),
      supabase
        .from("productos")
        .select("id, nombre, precio, aplica_iva, iva_porcentaje, imagen, porcentaje_oferta, producto_presentaciones (precio, porcentaje_oferta, orden, aplica_iva, iva_porcentaje), subcategorias (nombre, categorias (nombre))")
        .order("nombre"),
    ]);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Supabase timeout")), SUPABASE_TIMEOUT_MS)
    );
    const [catRes, prodRes, ofertaRes] = await Promise.race([queries, timeoutPromise]);
    categoriasDb = catRes.data;
    productosDestacados = (prodRes.data ?? []) as unknown as typeof productosDestacados;
    const todosProductos = (ofertaRes.data ?? []) as unknown as typeof productosDestacados;
    productosEnOferta = todosProductos.filter((p) => {
      const ofertaProd = p.porcentaje_oferta != null && p.porcentaje_oferta > 0;
      const pps = Array.isArray(p.producto_presentaciones) ? p.producto_presentaciones : p.producto_presentaciones ? [p.producto_presentaciones] : [];
      const ofertaPres = pps.some((pp: { porcentaje_oferta?: number | null }) => pp.porcentaje_oferta != null && pp.porcentaje_oferta > 0);
      return ofertaProd || ofertaPres;
    });
  } catch {
    categoriasDb = [];
    productosDestacados = [];
    productosEnOferta = [];
  }

  const categorias = (categoriasDb ?? []).map((cat, i) => ({
    id: cat.id,
    nombre: cat.nombre,
    slug: cat.nombre.toLowerCase().replace(/\s+/g, "-").normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
    imagen: cat.imagen ?? IMAGENES_PLACEHOLDER[i % IMAGENES_PLACEHOLDER.length],
  }));
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffeef7,transparent_42%),#fff7ef] text-slate-800">
      <main className="mx-auto w-full max-w-[1260px] px-3 pb-6 pt-3 sm:px-6">
        <TopBar />

        <Header />

        <Suspense fallback={null}>
          <PedidoSuccessBanner />
        </Suspense>

        <div className="mt-4">
          <RastrearPedido />
        </div>

        <section className="mt-8 rounded-[24px] border border-[#f3dcff] bg-white p-8 shadow-[0_12px_28px_rgba(123,31,162,0.08)] sm:p-10">
          <h2 className="text-center text-2xl font-black text-[var(--ca-purple)] sm:text-3xl">
            Encuentra lo mejor para tu mascota.
            <br />
            ¿Para quién estás comprando hoy?
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {categorias.length === 0 ? (
              <p className="col-span-full py-6 text-center text-slate-500">
                Agrega categorías desde el dashboard para verlas aquí.
              </p>
            ) : (
              categorias.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/tienda/${cat.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-[var(--ca-orange)]/50 hover:shadow-lg"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={cat.imagen}
                      alt={cat.nombre}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <span className="mx-2 mb-2 mt-1.5 rounded-full bg-[var(--ca-orange)]/15 py-1.5 text-center text-xs font-bold text-[var(--ca-orange)] transition group-hover:bg-[var(--ca-orange)] group-hover:text-white sm:text-sm">
                    {cat.nombre}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="mt-5 rounded-full bg-gradient-to-r from-[#fff4d8] via-[#ffe9bf] to-[#ffc874] px-5 py-3 shadow-[0_10px_26px_rgba(255,122,0,0.24)]">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p className="text-center text-lg font-black text-[var(--ca-blue)] sm:text-left">
              Envíos GRATIS en Barrancabermeja
            </p>
            <Link href="/tienda" className="rounded-full bg-[var(--ca-purple)] px-6 py-2 text-sm font-bold text-white transition hover:brightness-110">
              Comprar ahora
            </Link>
          </div>
        </section>

        {productosEnOferta.length > 0 && (
          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-black text-[var(--ca-purple)] sm:text-2xl">
                Productos en oferta
              </h2>
              <Link
                href="/ofertas"
                className="rounded-full bg-gradient-to-r from-[#ff6b35] to-[#ff9b23] px-6 py-2 text-sm font-bold text-white shadow-lg transition hover:brightness-105"
              >
                Ver todas las ofertas
              </Link>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {productosEnOferta.slice(0, 8).map((producto) => {
                const precioBase = typeof producto.precio === "string" ? parseFloat(producto.precio) : Number(producto.precio);
                const pps = Array.isArray(producto.producto_presentaciones) ? producto.producto_presentaciones : producto.producto_presentaciones ? [producto.producto_presentaciones] : [];
                const primeraConOferta = [...pps].sort((a: { orden?: number }, b: { orden?: number }) => (a.orden ?? 0) - (b.orden ?? 0)).find((pp: { porcentaje_oferta?: number | null }) => pp.porcentaje_oferta != null && pp.porcentaje_oferta > 0);
                const ofertaProd = producto.porcentaje_oferta != null && producto.porcentaje_oferta > 0;
                const ofertaPorc = Number(primeraConOferta?.porcentaje_oferta ?? (ofertaProd ? producto.porcentaje_oferta : 0) ?? 0);
                const precioRef = primeraConOferta?.precio != null ? Number(primeraConOferta.precio) : precioBase;
                const ivaPorcentaje = resolverIvaPorcentaje({
                  ivaPorcentaje: (primeraConOferta as { iva_porcentaje?: number | null })?.iva_porcentaje,
                  aplicaIva: (primeraConOferta as { aplica_iva?: boolean })?.aplica_iva,
                  fallbackPorcentaje: (producto as { iva_porcentaje?: number | null }).iva_porcentaje,
                  fallbackAplicaIva: (producto as { aplica_iva?: boolean }).aplica_iva,
                });
                const precioSinIva = ofertaPorc > 0 ? precioRef * (1 - ofertaPorc / 100) : precioRef;
                const precioNum = aplicarIva(precioSinIva, ivaPorcentaje);
                const precioOriginal = aplicarIva(precioRef, ivaPorcentaje);
                const imagen = producto.imagen ?? IMAGENES_PLACEHOLDER[productosEnOferta.indexOf(producto) % IMAGENES_PLACEHOLDER.length];
                return (
                  <Link key={producto.id} href={`/producto/${producto.id}`}>
                    <article className="card-lift overflow-hidden rounded-3xl border border-[#ece2ff] bg-white p-3 shadow-[0_10px_26px_rgba(123,31,162,0.12)]">
                      <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
                        <span className="absolute left-3 top-3 z-10 rounded-full bg-[#ff6b35] px-3 py-1 text-[10px] font-black text-white">
                          {ofertaPorc}% OFF
                        </span>
                        <img src={imagen} alt={producto.nombre} className="h-full w-full object-cover" />
                      </div>
                      <h3 className="mt-3 line-clamp-2 text-base font-bold text-slate-800">{producto.nombre}</h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm text-slate-500 line-through">
                          ${precioOriginal.toLocaleString("es-CO")}
                        </span>
                        <p className="text-2xl font-black text-[var(--ca-orange)]">
                          ${precioNum.toLocaleString("es-CO")}
                        </p>
                      </div>
                      <div className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--ca-orange)] to-[#ff9b23] px-4 py-2 text-sm font-bold text-white transition hover:brightness-105">
                        <ShoppingCart size={15} />
                        Ver producto
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-black text-[var(--ca-purple)] sm:text-2xl">
              Productos Destacados
            </h2>
            <Link
              href="/tienda"
              className="rounded-full bg-[var(--ca-purple)] px-6 py-2 text-sm font-bold text-white shadow-lg transition hover:brightness-105"
            >
              Ver todos los destacados
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {productosDestacados.length === 0 ? (
              <p className="col-span-full py-12 text-center text-slate-500">
                No hay productos destacados. Marca productos como &quot;Producto destacado&quot; en el dashboard para verlos aquí.
              </p>
            ) : (
              productosDestacados.map((producto) => {
                const precioBase = typeof producto.precio === "string" ? parseFloat(producto.precio) : Number(producto.precio);
                const pps = Array.isArray(producto.producto_presentaciones) ? producto.producto_presentaciones : producto.producto_presentaciones ? [producto.producto_presentaciones] : [];
                const primeraConOferta = [...pps].sort((a: { orden?: number }, b: { orden?: number }) => (a.orden ?? 0) - (b.orden ?? 0)).find((pp: { porcentaje_oferta?: number | null }) => pp.porcentaje_oferta != null && pp.porcentaje_oferta > 0);
                const ofertaProd = producto.porcentaje_oferta != null && producto.porcentaje_oferta > 0;
                const ofertaPorc = primeraConOferta?.porcentaje_oferta ?? (ofertaProd ? producto.porcentaje_oferta : 0) ?? 0;
                const precioRef = primeraConOferta?.precio != null ? Number(primeraConOferta.precio) : precioBase;
                const ivaPorcentaje = resolverIvaPorcentaje({
                  ivaPorcentaje: (primeraConOferta as { iva_porcentaje?: number | null })?.iva_porcentaje,
                  aplicaIva: (primeraConOferta as { aplica_iva?: boolean })?.aplica_iva,
                  fallbackPorcentaje: (producto as { iva_porcentaje?: number | null }).iva_porcentaje,
                  fallbackAplicaIva: (producto as { aplica_iva?: boolean }).aplica_iva,
                });
                const precioSinIva = ofertaPorc > 0 ? precioRef * (1 - ofertaPorc / 100) : precioRef;
                const precioNum = aplicarIva(precioSinIva, ivaPorcentaje);
                const badge = ofertaPorc > 0 ? `${ofertaPorc}% OFF` : "Destacado";
                const imagen =
                  producto.imagen ??
                  IMAGENES_PLACEHOLDER[
                    productosDestacados.indexOf(producto) % IMAGENES_PLACEHOLDER.length
                  ];
                return (
                  <Link key={producto.id} href={`/producto/${producto.id}`}>
                    <article className="card-lift overflow-hidden rounded-3xl border border-[#ece2ff] bg-white p-3 shadow-[0_10px_26px_rgba(123,31,162,0.12)]">
                      <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
                        <span className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-[10px] font-black text-white ${badge.includes("%") ? "bg-[#ff6b35]" : "bg-[#63c132]"}`}>
                          {badge}
                        </span>
                        <img
                          src={imagen}
                          alt={producto.nombre}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <h3 className="mt-3 line-clamp-2 text-base font-bold text-slate-800">
                        {producto.nombre}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        {ofertaPorc > 0 && (
                          <span className="text-sm text-slate-500 line-through">
                            ${aplicarIva(precioRef, ivaPorcentaje).toLocaleString("es-CO")}
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
                    </article>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-[#f0ddff] bg-white p-4 shadow-[0_12px_28px_rgba(123,31,162,0.1)] sm:p-6">
          <h3 className="text-4xl font-black text-[var(--ca-purple)]">
            ¿Por qué comprar con nosotros?
          </h3>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-[#fff8e8] p-3 text-center">
                <Truck className="mx-auto text-[var(--ca-orange)]" />
                <p className="mt-2 text-sm font-bold text-slate-700">Entrega en 24h</p>
              </div>
              <div className="rounded-2xl bg-[#e8f9dd] p-3 text-center">
                <ShieldCheck className="mx-auto text-[#42b522]" />
                <p className="mt-2 text-sm font-bold text-slate-700">Compras seguras</p>
              </div>
              <div className="rounded-2xl bg-[#f1e7ff] p-3 text-center">
                <PackageCheck className="mx-auto text-[var(--ca-purple)]" />
                <p className="mt-2 text-sm font-bold text-slate-700">Calidad premium</p>
              </div>
              <div className="rounded-2xl bg-[#ffeef8] p-3 text-center">
                <PawPrint className="mx-auto text-[#f24a98]" />
                <p className="mt-2 text-sm font-bold text-slate-700">Cuidamos cada detalle</p>
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-[#fff8e8] to-[#f2ebff] p-4">
              <p className="text-lg font-bold leading-7 text-slate-700">
                Excelente servicio, mi perro ama sus productos y llegaron súper rápido.
              </p>
              <p className="mt-2 text-sm font-bold text-[var(--ca-purple)]">- Maria P.</p>
            </div>
          </div>
        </section>

        <Footer />

        <WhatsAppFloatingButton />
      </main>
    </div>
  );
}
