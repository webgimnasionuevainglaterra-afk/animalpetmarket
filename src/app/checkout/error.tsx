"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-center rounded-2xl border border-red-200 bg-white p-8 shadow-lg">
        <AlertTriangle size={40} className="text-red-500" />
        <h2 className="mt-4 text-lg font-bold text-slate-800">Error al cargar el checkout</h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          No pudimos cargar la página. Intenta de nuevo o vuelve al carrito.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-2 rounded-xl bg-[var(--ca-purple)] px-5 py-2.5 font-bold text-white"
          >
            <RefreshCw size={18} />
            Reintentar
          </button>
          <Link
            href="/carrito"
            className="rounded-xl border-2 border-slate-200 px-5 py-2.5 font-bold text-slate-700 hover:bg-slate-50"
          >
            Ver carrito
          </Link>
        </div>
      </div>
    </div>
  );
}
