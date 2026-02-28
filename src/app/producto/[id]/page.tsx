import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ProductoDetalle } from "@/components/ProductoDetalle";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/validations";
import { ArrowLeft, MessageCircle, Truck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const IMAGEN_PLACEHOLDER =
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop";

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidUUID(id)) notFound();

  const supabase = await createClient();

  const { data: producto, error } = await supabase
    .from("productos")
    .select(`
      id,
      nombre,
      descripcion,
      precio,
      aplica_iva,
      imagen,
      porcentaje_oferta,
      peso,
      dimensiones,
      requiere_refrigeracion,
      producto_fragil,
      destacado,
      nuevo,
      mas_vendido,
      recomendado,
      secciones_activas,
      datos_medicamento,
      datos_alimento,
      datos_juguete,
      subcategorias (nombre, categorias (nombre))
    `)
    .eq("id", id)
    .single();

  if (error || !producto) notFound();

  const { data: presentaciones } = await supabase
    .from("producto_presentaciones")
    .select("id, nombre, imagen, precio, orden, porcentaje_oferta, aplica_iva")
    .eq("producto_id", id)
    .order("orden");

  const sub = Array.isArray(producto.subcategorias)
    ? producto.subcategorias[0]
    : producto.subcategorias;
  const catRaw = sub?.categorias;
  const cat = (Array.isArray(catRaw) ? catRaw[0] : catRaw) as { nombre: string } | undefined;
  const catSlug = cat
    ? cat.nombre.toLowerCase().replace(/\s+/g, "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    : "";
  const subSlug = sub
    ? (sub as { nombre: string }).nombre
        .toLowerCase()
        .replace(/\s+/g, "-")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
    : "";
  const volverHref = catSlug && subSlug ? `/tienda/${catSlug}/${subSlug}` : "/";

  const precioNum =
    typeof producto.precio === "string"
      ? parseFloat(producto.precio)
      : Number(producto.precio);

  const imagenes: { url: string; label?: string }[] = [];
  if (producto.imagen) imagenes.push({ url: producto.imagen, label: "Principal" });
  (presentaciones ?? [])
    .sort((a, b) => a.orden - b.orden)
    .forEach((p) => {
      if (p.imagen) imagenes.push({ url: p.imagen!, label: p.nombre });
    });
  if (imagenes.length === 0) imagenes.push({ url: IMAGEN_PLACEHOLDER });

  const badge = producto.mas_vendido
    ? "Más vendido"
    : producto.nuevo
      ? "Nuevo"
      : producto.destacado
        ? "Destacado"
        : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffeef7,transparent_42%),#fff7ef] text-slate-800">
      <main className="mx-auto w-full max-w-[1260px] px-3 pb-6 pt-3 sm:px-6">
        <div className="rounded-xl bg-[var(--ca-purple)] px-4 py-2.5 text-white shadow-md">
          <div className="flex flex-col items-center justify-between gap-1 text-sm font-medium sm:flex-row sm:text-base">
            <div className="flex items-center gap-2">
              <Truck size={14} />
              <span>Envío rápido y seguro</span>
              <span className="hidden sm:inline">|</span>
              <span>Soporte 24/7</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle size={14} />
              <span>311 234 5678</span>
            </div>
          </div>
        </div>

        <Header />

        <section className="mt-6">
          <Link
            href={volverHref}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--ca-purple)] hover:underline"
          >
            <ArrowLeft size={18} />
            Volver
          </Link>

          <div className="overflow-hidden rounded-[24px] border border-[#f3dcff] bg-white shadow-[0_22px_52px_rgba(123,31,162,0.12)]">
            <div className="p-6 lg:p-8">
              <ProductoDetalle
                productId={producto.id}
                nombre={producto.nombre}
                precioBase={precioNum}
                aplicaIvaBase={(producto as { aplica_iva?: boolean }).aplica_iva !== false}
                descripcion={producto.descripcion}
                imagenes={imagenes}
                presentaciones={(presentaciones ?? []).map((p) => ({
                  ...p,
                  aplica_iva: p.aplica_iva != null ? !!p.aplica_iva : undefined,
                }))}
                badge={badge}
                porcentajeOfertaBase={producto.porcentaje_oferta != null ? Number(producto.porcentaje_oferta) : null}
                datosMedicamento={
                  producto.datos_medicamento as Record<string, string> | null
                }
                datosAlimento={
                  producto.datos_alimento as Record<string, string> | null
                }
                datosJuguete={
                  producto.datos_juguete as Record<string, string> | null
                }
                peso={producto.peso != null ? Number(producto.peso) : null}
                dimensiones={producto.dimensiones}
              />
            </div>
          </div>
        </section>

        <Footer />

        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUM || "573001234567"}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-green-500/40 transition hover:scale-110 hover:shadow-xl"
          aria-label="Contactar por WhatsApp"
        >
          <MessageCircle size={28} strokeWidth={2} />
        </a>
      </main>
    </div>
  );
}
