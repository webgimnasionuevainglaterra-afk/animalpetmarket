"use client";

import { Printer } from "lucide-react";

type Pedido = { id: string };

export function FacturaImprimir({ pedido }: { pedido: Pedido }) {
  return (
    <button
      type="button"
      onClick={() =>
        window.open(`/dashboard/pedidos/${pedido.id}/factura`, "_blank", "noopener")
      }
      className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-200"
      title="Imprimir factura"
    >
      <Printer size={16} />
      Imprimir factura
    </button>
  );
}
