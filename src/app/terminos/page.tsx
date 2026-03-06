import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffeef7,transparent_42%),#fff7ef] text-slate-800">
      <main className="mx-auto w-full max-w-[1260px] px-3 pb-6 pt-3 sm:px-6">
        <Header />

        <article className="mt-6 overflow-hidden rounded-[24px] border border-[#f3dcff] bg-white p-6 shadow-[0_22px_52px_rgba(123,31,162,0.12)] sm:p-8">
          <h1 className="text-3xl font-black text-[var(--ca-purple)]">Términos y condiciones</h1>
          <p className="mt-2 text-sm text-slate-500">Última actualización: {new Date().toLocaleDateString("es-CO")}</p>

          <div className="prose prose-slate mt-8 max-w-none">
            <h2 className="text-xl font-bold text-slate-800">1. Aceptación de los términos</h2>
            <p className="mt-2 text-slate-600">
              Al acceder y utilizar los servicios de Pet Market Animal, aceptas estar sujeto a estos términos y condiciones.
              Si no estás de acuerdo con alguna parte de los mismos, te recomendamos no utilizar nuestra plataforma.
            </p>

            <h2 className="mt-6 text-xl font-bold text-slate-800">2. Descripción del servicio</h2>
            <p className="mt-2 text-slate-600">
              Pet Market Animal es una tienda en línea especializada en productos para mascotas. Ofrecemos alimentos,
              accesorios, medicamentos y otros artículos relacionados con el cuidado animal. Los pedidos se procesan
              según disponibilidad y se entregan en la zona de cobertura establecida.
            </p>

            <h2 className="mt-6 text-xl font-bold text-slate-800">3. Pedidos y pagos</h2>
            <p className="mt-2 text-slate-600">
              Los pedidos realizados a través de nuestra plataforma están sujetos a disponibilidad de inventario.
              El pago se realiza contra entrega. Nos reservamos el derecho de rechazar pedidos en caso de
              irregularidades o falta de stock.
            </p>

            <h2 className="mt-6 text-xl font-bold text-slate-800">4. Privacidad</h2>
            <p className="mt-2 text-slate-600">
              La información que nos proporcionas al realizar un pedido o suscribirte a nuestro boletín se utiliza
              únicamente para procesar tu solicitud y mejorar nuestro servicio. Consulta nuestra{" "}
              <Link href="/privacidad" className="font-semibold text-[var(--ca-purple)] hover:underline">
                política de privacidad
              </Link>{" "}
              para más detalles.
            </p>

            <h2 className="mt-6 text-xl font-bold text-slate-800">5. Contacto</h2>
            <p className="mt-2 text-slate-600">
              Para cualquier consulta sobre estos términos, puedes contactarnos a través de nuestra{" "}
              <Link href="/contacto" className="font-semibold text-[var(--ca-purple)] hover:underline">
                página de contacto
              </Link>
              .
            </p>
          </div>
        </article>

        <Footer />
      </main>
    </div>
  );
}
