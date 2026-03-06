import { getConfiguracion } from "@/lib/config";
import { Phone, Truck } from "lucide-react";

export default async function TopBar() {
  const config = await getConfiguracion();

  return (
    <div className="rounded-xl bg-[var(--ca-purple)] px-4 py-2.5 text-white shadow-md">
      <div className="flex flex-col items-center justify-between gap-1 text-sm font-medium sm:flex-row sm:text-base">
        <div className="flex items-center gap-2">
          <Truck size={14} />
          <span>Envío rápido y seguro</span>
          <span className="hidden sm:inline">|</span>
          <span>Soporte 24/7</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone size={14} />
          <span>{config.telefono || "—"}</span>
        </div>
      </div>
    </div>
  );
}
