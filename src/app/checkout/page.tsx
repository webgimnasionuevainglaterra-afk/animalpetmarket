import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { MessageCircle } from "lucide-react";
import { CheckoutClient } from "./CheckoutClient";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffeef7,transparent_42%),#fff7ef] text-slate-800">
      <main className="mx-auto w-full max-w-[1260px] px-3 pb-6 pt-3 sm:px-6">
        <Header />
        <CheckoutClient />
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
