"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
          <div className="flex max-w-md flex-col items-center rounded-2xl border border-red-200 bg-white p-8 shadow-lg">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h1 className="mt-4 text-xl font-black text-slate-800">
              Algo salió mal
            </h1>
            <p className="mt-2 text-center text-sm text-slate-600">
              Ha ocurrido un error crítico. Intenta recargar la página.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 flex items-center gap-2 rounded-xl bg-[#7b1fa2] px-6 py-3 font-bold text-white transition hover:brightness-110"
            >
              <RefreshCw size={18} />
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
