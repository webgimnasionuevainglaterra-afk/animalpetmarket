import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getConfiguracion, getWhatsappNum } from "@/lib/config";
import { ContactoForm } from "./ContactoForm";

export default async function ContactoPage() {
  const config = await getConfiguracion();
  const whatsappNum = getWhatsappNum(config);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffeef7,transparent_42%),#fff7ef] text-slate-800">
      <main className="mx-auto w-full max-w-[1260px] px-3 pb-6 pt-3 sm:px-6">
        <Header />

        <section className="mt-6 overflow-hidden rounded-[24px] border border-[#f3dcff] bg-white shadow-[0_22px_52px_rgba(123,31,162,0.12)]">
          <div className="border-b border-slate-100 bg-gradient-to-r from-[#fef3fb] to-[#fff9f0] px-6 py-8 sm:px-8">
            <h1 className="text-3xl font-black text-[var(--ca-purple)] sm:text-4xl">
              Contacto
            </h1>
            <p className="mt-1 text-slate-600">
              Escríbenos y te responderemos lo antes posible.
            </p>
          </div>

          <div className="grid gap-8 p-6 sm:grid-cols-2 sm:p-8">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Información de contacto</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-3">
                  <span className="text-[var(--ca-purple)]">📍</span>
                  {config.direccion || "—"}
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[var(--ca-purple)]">📞</span>
                  {config.telefono || "—"}
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[var(--ca-purple)]">✉️</span>
                  {config.email || "—"}
                </li>
              </ul>
              <a
                href={`https://wa.me/${whatsappNum}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 font-bold text-white transition hover:brightness-110"
              >
                💬 Chatear por WhatsApp
              </a>
            </div>

            <ContactoForm />
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
