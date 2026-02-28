"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function PedidoSuccessBanner() {
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);
  const numeroOrden = searchParams.get("orden");

  useEffect(() => {
    if (searchParams.get("pedido") === "ok") {
      setShow(true);
      const t = setTimeout(() => setShow(false), 10000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  if (!show) return null;

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white">
            <Check size={22} />
          </div>
          <div>
            <p className="font-bold text-green-800">¡Pedido realizado!</p>
            <p className="text-sm text-green-700">
              {numeroOrden ? (
                <>
                  Tu número de pedido es <strong>{numeroOrden}</strong>. Guárdalo para rastrear tu pedido. Pago contra entrega.
                </>
              ) : (
                "Te contactaremos pronto. Pago contra entrega."
              )}
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="text-sm font-semibold text-green-700 hover:underline"
          onClick={() => setShow(false)}
        >
          Cerrar
        </Link>
      </div>
    </div>
  );
}
