import { getConfiguracion, getWhatsappNum } from "@/lib/config";
import { MessageCircle } from "lucide-react";

export async function WhatsAppFloatingButton() {
  const config = await getConfiguracion();
  const whatsappNum = getWhatsappNum(config);

  return (
    <a
      href={`https://wa.me/${whatsappNum}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-green-500/40 transition hover:scale-110 hover:shadow-xl"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle size={28} strokeWidth={2} />
    </a>
  );
}
