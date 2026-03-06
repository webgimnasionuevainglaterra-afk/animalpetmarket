import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import { CarritoClient } from "./CarritoClient";

export default function CarritoPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffeef7,transparent_42%),#fff7ef] text-slate-800">
      <main className="mx-auto w-full max-w-[1260px] px-3 pb-6 pt-3 sm:px-6">
        <TopBar />
        <Header />
        <CarritoClient />

        <Footer />
      </main>
    </div>
  );
}
