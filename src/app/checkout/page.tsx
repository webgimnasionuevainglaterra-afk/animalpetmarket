import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { WhatsAppFloatingButton } from "@/components/WhatsAppFloatingButton";
import { CheckoutClient } from "./CheckoutClient";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffeef7,transparent_42%),#fff7ef] text-slate-800">
      <main className="mx-auto w-full max-w-[1260px] px-3 pb-6 pt-3 sm:px-6">
        <Header />
        <CheckoutClient />
        <Footer />
        <WhatsAppFloatingButton />
      </main>
    </div>
  );
}
