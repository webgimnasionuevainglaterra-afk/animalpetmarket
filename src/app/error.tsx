"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,#ffeef7,transparent_42%),#fff7ef] px-4">
      <div className="flex max-w-md flex-col items-center rounded-2xl border border-red-200 bg-white p-8 shadow-lg">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle size={32} className="text-red-600" />
        </div>
        <h1 className="mt-4 text-xl font-black text-slate-800">
          Algo salió mal
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Ha ocurrido un error inesperado. Puedes intentar de nuevo o volver al inicio.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="flex items-center justify-center gap-2 rounded-xl bg-[var(--ca-purple)] px-6 py-3 font-bold text-white transition hover:brightness-110"
          >
            <RefreshCw size={18} />
            Reintentar
          </button>
          <Link
            href="/"
            className="flex items-center justify-center rounded-xl border-2 border-slate-200 px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
