import { NewsletterForm } from "@/components/NewsletterForm";
import { getConfiguracion, getWhatsappNum } from "@/lib/config";
import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";

export default async function Footer() {
  const config = await getConfiguracion();
  const whatsappNum = getWhatsappNum(config);

  return (
    <footer className="mt-8 overflow-hidden rounded-[24px] bg-gradient-to-r from-[#6a1b9a] via-[#7b1fa2] to-[#8e24aa] text-white shadow-[0_18px_42px_rgba(106,27,154,0.35)]">
      <div className="grid gap-6 p-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.2fr] lg:p-7">
        <div>
          <h4 className="text-lg font-black">Contáctanos</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/90">
            <li className="flex items-center gap-2">
              <MapPin size={14} />
              <span>{config.direccion || "—"}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={14} />
              <span>{config.telefono || "—"}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={14} />
              <span>{config.email || "—"}</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-black">Enlaces rápidos</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/90">
            <li>
              <Link href="/" className="hover:underline">Inicio</Link>
            </li>
            <li>
              <Link href="/tienda" className="hover:underline">Tienda</Link>
            </li>
            <li>
              <Link href="/ofertas" className="hover:underline">Ofertas</Link>
            </li>
            <li>
              <Link href="/contacto" className="hover:underline">Contacto</Link>
            </li>
            <li>
              <Link href="/terminos" className="hover:underline">Términos y condiciones</Link>
            </li>
            <li>
              <Link href="/privacidad" className="hover:underline">Política de privacidad</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-black">Síguenos</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/90">
            <li>
              <a
                href={config.facebook_url || "https://facebook.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <Facebook size={14} /> Facebook
              </a>
            </li>
            <li>
              <a
                href={config.instagram_url || "https://instagram.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <Instagram size={14} /> Instagram
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/${whatsappNum}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            </li>
          </ul>
        </div>

        <NewsletterForm />
      </div>

      <div className="border-t border-white/20 px-4 py-3 text-center text-xs text-white/85">
        © {new Date().getFullYear()} {config.nombre_tienda || "Pet Market Animal"}. Todos los derechos reservados. Desarrollado por{" "}
        <a
          href="https://wa.me/13054094832"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline hover:text-white"
        >
          Gustavo Moreno
        </a>
      </div>
    </footer>
  );
}
