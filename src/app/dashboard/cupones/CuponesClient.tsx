"use client";

import { crearCupon } from "./actions";
import { Download, Tag } from "lucide-react";
import { useState } from "react";

type Cupon = {
  id: string;
  codigo: string;
  porcentaje: number;
  usado: boolean;
  pedido_id: string | null;
  valido_hasta: string | null;
  created_at: string;
};

export function CuponesClient({ cupones }: { cupones: Cupon[] }) {
  const [porcentaje, setPorcentaje] = useState("");
  const [validoHasta, setValidoHasta] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<"todos" | "disponibles" | "usados">("todos");

  const filtrados =
    filtro === "todos"
      ? cupones
      : filtro === "disponibles"
        ? cupones.filter((c) => !c.usado)
        : cupones.filter((c) => c.usado);

  function exportarCSV() {
    const esc = (v: string | number) => {
      const s = String(v);
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = ["Código", "Descuento (%)", "Estado", "Válido hasta", "Fecha creación"];
    const filas = filtrados.map((c) => [
      esc(c.codigo),
      c.porcentaje,
      esc(c.usado ? "Usado" : "Disponible"),
      esc(c.valido_hasta ? new Date(c.valido_hasta).toLocaleDateString("es-CO") : "—"),
      esc(new Date(c.created_at).toLocaleString("es-CO")),
    ]);
    const csv = [headers.join(","), ...filas.map((f) => f.join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cupones-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const pct = parseInt(porcentaje, 10);
    if (isNaN(pct) || pct < 1 || pct > 99) {
      setError("Ingresa un porcentaje entre 1 y 99");
      return;
    }
    setLoading(true);
    const res = await crearCupon(pct, validoHasta.trim() || null);
    setLoading(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    if ("success" in res && res.success && res.cupon) {
      setPorcentaje("");
      setValidoHasta("");
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-[var(--ca-purple)]">
            <Tag size={28} />
            Cupones
          </h1>
          <p className="mt-1 text-slate-600">
            Códigos de 6 caracteres con descuento por porcentaje. Uso único.
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

      <form onSubmit={handleCrear} className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-6">
        <h2 className="text-lg font-bold text-slate-800">Crear cupón</h2>
        <p className="mt-1 text-sm text-slate-500">
          Se generará un código automáticamente. El cupón se puede usar una sola vez.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Porcentaje de descuento *
            </label>
            <input
              type="number"
              min={1}
              max={99}
              value={porcentaje}
              onChange={(e) => setPorcentaje(e.target.value)}
              placeholder="Ej: 10"
              className="h-11 w-24 rounded-lg border border-slate-200 px-3"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Válido hasta (opcional)
            </label>
            <input
              type="date"
              value={validoHasta}
              onChange={(e) => setValidoHasta(e.target.value)}
              className="h-11 rounded-lg border border-slate-200 px-3"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[var(--ca-purple)] px-6 py-2.5 font-bold text-white disabled:opacity-60"
          >
            {loading ? "Creando..." : "Crear cupón"}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </form>

      <div className="mt-6">
        <div className="flex flex-wrap gap-2">
          {(["todos", "disponibles", "usados"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                filtro === f
                  ? "bg-[var(--ca-purple)] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f === "todos" ? "Todos" : f === "disponibles" ? "Disponibles" : "Usados"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
        {filtrados.length === 0 ? (
          <p className="py-12 text-center text-slate-500">
            No hay cupones.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">Código</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Descuento</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Estado</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Válido hasta</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Creado</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">{c.codigo}</td>
                  <td className="px-4 py-3 text-slate-700">{c.porcentaje}%</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        c.usado ? "bg-slate-200 text-slate-600" : "bg-green-100 text-green-800"
                      }`}
                    >
                      {c.usado ? "Usado" : "Disponible"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.valido_hasta
                      ? new Date(c.valido_hasta).toLocaleDateString("es-CO")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(c.created_at).toLocaleDateString("es-CO")}
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
