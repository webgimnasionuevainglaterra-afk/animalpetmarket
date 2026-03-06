import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffeef7,transparent_42%),#fff7ef] text-slate-800">
      <main className="mx-auto w-full max-w-[1260px] px-3 pb-6 pt-3 sm:px-6">
        <Header />

        <article className="mt-6 overflow-hidden rounded-[24px] border border-[#f3dcff] bg-white p-6 shadow-[0_22px_52px_rgba(123,31,162,0.12)] sm:p-8">
          <h1 className="text-3xl font-black text-[var(--ca-purple)]">Política de privacidad</h1>
          <p className="mt-2 text-sm text-slate-500">Última actualización: {new Date().toLocaleDateString("es-CO")}</p>

          <div className="prose prose-slate mt-8 max-w-none">
            <h2 className="text-xl font-bold text-slate-800">1. Información que recopilamos</h2>
            <p className="mt-2 text-slate-600">
              Recopilamos la información que nos proporcionas al realizar un pedido (nombre, teléfono, dirección,
              correo electrónico), al suscribirte a nuestro boletín (correo electrónico) o al contactarnos a través
              del formulario de contacto.
            </p>

            <h2 className="mt-6 text-xl font-bold text-slate-800">2. Uso de la información</h2>
            <p className="mt-2 text-slate-600">
              Utilizamos tu información para procesar pedidos, enviar comunicaciones relacionadas con tu compra,
              responder consultas y, si te suscribiste, enviar promociones y novedades. No vendemos ni compartimos
              tus datos con terceros para fines de marketing.
            </p>

            <h2 className="mt-6 text-xl font-bold text-slate-800">3. Seguridad</h2>
            <p className="mt-2 text-slate-600">
              Implementamos medidas de seguridad para proteger tu información. Los datos se almacenan en servidores
              seguros y se transmiten de forma cifrada cuando corresponde.
            </p>

            <h2 className="mt-6 text-xl font-bold text-slate-800">4. Tus derechos</h2>
            <p className="mt-2 text-slate-600">
              Puedes solicitar acceso, corrección o eliminación de tus datos personales contactándonos. Si te
              suscribiste al boletín, puedes darte de baja en cualquier momento mediante el enlace incluido en
              nuestros correos.
            </p>

            <h2 className="mt-6 text-xl font-bold text-slate-800">5. Contacto</h2>
            <p className="mt-2 text-slate-600">
              Para ejercer tus derechos o consultas sobre esta política, utiliza nuestra{" "}
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
