"use client";

import { Download, Mail } from "lucide-react";
import { useState } from "react";

type Suscriptor = {
  id: string;
  email: string;
  created_at: string;
};

export function NewsletterClient({ suscriptores }: { suscriptores: Suscriptor[] }) {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = suscriptores.filter((s) =>
    s.email.toLowerCase().includes(busqueda.toLowerCase().trim())
  );

  function exportarCSV() {
    const headers = ["Email", "Fecha de suscripción"];
    const filas = filtrados.map((s) => [
      s.email,
      new Date(s.created_at).toLocaleString("es-CO"),
    ]);
    const csv = [headers.join(","), ...filas.map((f) => f.join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `suscriptores-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-[var(--ca-purple)]">
            <Mail size={28} />
            Newsletter
          </h1>
          <p className="mt-1 text-slate-600">
            {suscriptores.length} suscriptor{suscriptores.length !== 1 ? "es" : ""} registrado{suscriptores.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={exportarCSV}
          disabled={filtrados.length === 0}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </div>

      <div className="mt-6">
        <input
          type="text"
          placeholder="Buscar por correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--ca-purple)]"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
        {filtrados.length === 0 ? (
          <p className="py-12 text-center text-slate-500">
            {busqueda.trim() ? "No hay suscriptores que coincidan con la búsqueda." : "Aún no hay suscriptores."}
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">Correo electrónico</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Fecha de suscripción</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-800">{s.email}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(s.created_at).toLocaleString("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
