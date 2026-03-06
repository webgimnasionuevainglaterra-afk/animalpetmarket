"use client";

import {
  buscarPedidoPorNumero,
  type HistorialPedido,
  type PedidoRastreo,
} from "@/app/rastrear/actions";
import { Package, Search } from "lucide-react";
import { useState } from "react";

const ESTADOS: Record<string, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-800" },
  confirmado: { label: "Confirmado", color: "bg-blue-100 text-blue-800" },
  enviado: { label: "Enviado", color: "bg-indigo-100 text-indigo-800" },
  despachado: { label: "Despachado", color: "bg-green-100 text-green-800" },
  entregado: { label: "Entregado", color: "bg-green-100 text-green-800" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

function formatNumeroOrden(n: number | null): string {
  if (n == null) return "-";
  return `ORD-${String(n).padStart(4, "0")}`;
}

export function RastrearPedido() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    pedido: PedidoRastreo;
    historial: HistorialPedido[];
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!input.trim()) {
      setError("Ingresa tu número de pedido o teléfono");
      return;
    }
    setLoading(true);
    const res = await buscarPedidoPorNumero(input.trim());
    setLoading(false);
    if (res.success) {
      setResult({ pedido: res.pedido, historial: res.historial });
    } else {
      setError(res.error);
    }
  }

  return (
    <section className="rounded-[24px] border border-[#f3dcff] bg-white p-6 shadow-[0_12px_28px_rgba(123,31,162,0.08)] sm:p-8">
      <h2 className="flex items-center gap-2 text-xl font-black text-[var(--ca-purple)] sm:text-2xl">
        <Package size={24} />
        Rastrea tu pedido
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Ingresa tu número de pedido (ORD-0001) o tu teléfono para ver el estado y tu historial.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ORD-0001 o 300 123 4567"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--ca-purple)] focus:ring-2 focus:ring-[var(--ca-purple)]/20"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[var(--ca-purple)] px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-6">
          {/* Pedido actual */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white p-4">
              <div>
                <p className="font-bold text-slate-800">
                  {formatNumeroOrden(result.pedido.numero_orden)} · {result.pedido.nombre_cliente}
                </p>
                <p className="text-sm text-slate-500">
                  {new Date(result.pedido.created_at).toLocaleString("es-CO", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {result.pedido.fecha_despacho && (
                    <span className="ml-2 text-green-600">
                      · Despachado: {new Date(result.pedido.fecha_despacho).toLocaleDateString("es-CO")}
                    </span>
                  )}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  ESTADOS[result.pedido.estado]?.color ?? "bg-slate-100 text-slate-700"
                }`}
              >
                {ESTADOS[result.pedido.estado]?.label ?? result.pedido.estado}
              </span>
              <p className="font-black text-[var(--ca-orange)]">
                ${result.pedido.total.toLocaleString("es-CO")}
              </p>
            </div>
            <div className="p-4">
              {result.pedido.estado === "entregado" && result.pedido.entrega_foto_url && (
                <div className="mb-4">
                  <p className="mb-2 text-sm font-bold text-slate-700">Foto de entrega</p>
                  <a
                    href={result.pedido.entrega_foto_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={result.pedido.entrega_foto_url}
                      alt="Pedido entregado"
                      className="max-h-64 rounded-lg border border-slate-200 object-cover"
                    />
                  </a>
                </div>
              )}
              <p className="mb-2 text-sm font-bold text-slate-700">Productos</p>
              <ul className="space-y-1 text-sm">
                {result.pedido.items.map((item, i) => (
                  <li key={i} className="flex justify-between text-slate-600">
                    <span>
                      {item.nombre} ({item.presentacion}) x{item.cantidad}
                    </span>
                    <span className="font-semibold">
                      ${item.subtotal.toLocaleString("es-CO")}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-right font-black text-[var(--ca-orange)]">
                Total: ${result.pedido.total.toLocaleString("es-CO")}
              </p>
            </div>
          </div>

          {/* Historial */}
          {result.historial.length > 1 && (
            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-700">Historial de pedidos</h3>
              <ul className="space-y-2">
                {result.historial.map((h) => (
                  <li
                    key={h.id}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 ${
                      h.id === result.pedido.id
                        ? "border-[var(--ca-purple)] bg-[var(--ca-purple)]/5"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">
                        {formatNumeroOrden(h.numero_orden)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          ESTADOS[h.estado]?.color ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {ESTADOS[h.estado]?.label ?? h.estado}
                      </span>
                      {h.fecha_despacho && (
                        <span className="text-xs text-green-600">
                          Despachado {new Date(h.fecha_despacho).toLocaleDateString("es-CO")}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-slate-700">
                      ${h.total.toLocaleString("es-CO")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
