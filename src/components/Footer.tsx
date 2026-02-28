import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-8 overflow-hidden rounded-[24px] bg-gradient-to-r from-[#6a1b9a] via-[#7b1fa2] to-[#8e24aa] text-white shadow-[0_18px_42px_rgba(106,27,154,0.35)]">
      <div className="grid gap-6 p-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.2fr] lg:p-7">
        <div>
          <h4 className="text-lg font-black">Contáctanos</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/90">
            <li className="flex items-center gap-2">
              <MapPin size={14} />
              <span>Barrancabermeja, Colombia</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={14} />
              <span>311 234 5678</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={14} />
              <span>info@petmarket.com</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-black">Enlaces rápidos</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/90">
            <li>
              <Link href="/" className="hover:underline">
                Inicio
              </Link>
            </li>
            <li>Tienda</li>
            <li>Ofertas</li>
            <li>Términos y condiciones</li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-black">Síguenos</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/90">
            <li className="flex items-center gap-2">
              <Facebook size={14} /> Facebook
            </li>
            <li className="flex items-center gap-2">
              <Instagram size={14} /> Instagram
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle size={14} /> WhatsApp
            </li>
          </ul>
        </div>

        <div className="rounded-2xl bg-white/14 p-4 backdrop-blur">
          <h4 className="text-lg font-black">Suscríbete</h4>
          <p className="mt-1 text-sm text-white/90">
            Recibe promociones y consejos para tu mascota.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-full bg-white p-1.5">
            <input
              type="text"
              placeholder="Ingresa tu correo"
              className="w-full bg-transparent px-3 text-sm text-slate-700 outline-none"
            />
            <button className="rounded-full bg-[var(--ca-orange)] px-4 py-2 text-sm font-bold text-white">
              Suscribirme
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-white/20 px-4 py-3 text-center text-xs text-white/85">
        © {new Date().getFullYear()} Pet Market Animal. Todos los derechos reservados.
      </div>
    </footer>
  );
}
