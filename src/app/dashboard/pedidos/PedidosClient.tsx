"use client";

import { ChevronDown, ChevronUp, History, MapPin, Phone, Printer, Search, User } from "lucide-react";
import { useState } from "react";
import { marcarPendiente, marcarDespachado, rechazarPedido } from "./actions";
import { FacturaImprimir } from "./FacturaImprimir";

type PedidoItem = {
  nombre: string;
  presentacion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

type Venta = { fecha_venta: string } | { fecha_venta: string }[];

type Pedido = {
  id: string;
  numero_orden: number | null;
  nombre_cliente: string;
  telefono: string;
  direccion: string;
  notas: string | null;
  total: number;
  estado: string;
  created_at: string;
  pedido_items: PedidoItem[] | PedidoItem | null;
  ventas?: Venta | null;
};

type FiltroTab = "pendientes" | "despachados" | "todos";

function formatNumeroOrden(n: number | null): string {
  if (n == null) return "-";
  return `ORD-${String(n).padStart(4, "0")}`;
}

const ESTADOS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  enviado: "Enviado",
  despachado: "Despachado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

function getFechaDespacho(p: Pedido): string | null {
  const v = p.ventas;
  if (!v) return null;
  const venta = Array.isArray(v) ? v[0] : v;
  return venta?.fecha_venta ?? null;
}

export function PedidosClient({ pedidos }: { pedidos: Pedido[] }) {
  const [expandido, setExpandido] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroTab>("pendientes");
  const [busqueda, setBusqueda] = useState("");

  const items = (p: Pedido) => {
    const i = p.pedido_items;
    return Array.isArray(i) ? i : i ? [i] : [];
  };

  const pedidosPorFiltro = pedidos.filter((p) => {
    if (filtro === "pendientes") return p.estado !== "despachado" && p.estado !== "cancelado";
    if (filtro === "despachados") return p.estado === "despachado";
    return true;
  });

  const term = busqueda.trim().toLowerCase();
  const pedidosFiltrados = term
    ? pedidosPorFiltro.filter((p) => {
        const numOrden = formatNumeroOrden(p.numero_orden).toLowerCase();
        const nombre = (p.nombre_cliente ?? "").toLowerCase();
        const tel = (p.telefono ?? "").toLowerCase();
        const dir = (p.direccion ?? "").toLowerCase();
        const notas = (p.notas ?? "").toLowerCase();
        const itemsStr = items(p)
          .map((i) => `${i.nombre} ${i.presentacion}`.toLowerCase())
          .join(" ");
        return (
          numOrden.includes(term) ||
          nombre.includes(term) ||
          tel.includes(term) ||
          dir.includes(term) ||
          notas.includes(term) ||
          itemsStr.includes(term)
        );
      })
    : pedidosPorFiltro;

  const handlePendiente = async (id: string) => {
    setError(null);
    setLoading(id);
    const result = await marcarPendiente(id);
    setLoading(null);
    if (result?.error) setError(result.error);
  };
  const handleDespachado = async (id: string, total: number) => {
    setError(null);
    setLoading(id);
    const result = await marcarDespachado(id, total);
    setLoading(null);
    if (result?.error) setError(result.error);
  };
  const handleRechazado = async (id: string) => {
    if (!confirm("¿Rechazar y eliminar este pedido?")) return;
    setError(null);
    setLoading(id);
    const result = await rechazarPedido(id);
    setLoading(null);
    if (result?.error) setError(result.error);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[var(--ca-purple)]">
          Pedidos
        </h1>
        <p className="mt-2 text-slate-600">
          Pedidos contra entrega. Los datos de entrega se guardan aquí.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, teléfono, orden, dirección, producto..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--ca-purple)] focus:ring-2 focus:ring-[var(--ca-purple)]/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFiltro("pendientes")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
            filtro === "pendientes"
              ? "bg-amber-100 text-amber-800"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Pendientes
        </button>
        <button
          type="button"
          onClick={() => setFiltro("despachados")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
            filtro === "despachados"
              ? "bg-green-100 text-green-800"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <History size={16} />
          Historial despachados
        </button>
        <button
          type="button"
          onClick={() => setFiltro("todos")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
            filtro === "todos"
              ? "bg-[var(--ca-purple)]/10 text-[var(--ca-purple)]"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Todos
        </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {pedidosFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">
            {term
              ? "No se encontraron pedidos con esa búsqueda."
              : filtro === "pendientes"
                ? "No hay pedidos pendientes."
                : filtro === "despachados"
                  ? "No hay pedidos despachados en el historial."
                  : "No hay pedidos aún."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidosFiltrados.map((p) => {
            const isOpen = expandido === p.id;
            const total = typeof p.total === "string" ? parseFloat(p.total) : Number(p.total);
            const fecha = new Date(p.created_at).toLocaleString("es-CO", {
              dateStyle: "medium",
              timeStyle: "short",
            });
            return (
              <div
                key={p.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setExpandido(isOpen ? null : p.id)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-slate-50"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div>
                      <p className="font-bold text-slate-800">
                        {formatNumeroOrden(p.numero_orden)} · {p.nombre_cliente}
                      </p>
                      <p className="text-sm text-slate-500">
                        {fecha}
                        {p.estado === "despachado" && getFechaDespacho(p) && (
                          <span className="ml-2 text-green-600">
                            · Despachado: {new Date(getFechaDespacho(p)!).toLocaleDateString("es-CO")}
                          </span>
                        )}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        p.estado === "pendiente"
                          ? "bg-amber-100 text-amber-800"
                          : p.estado === "despachado" || p.estado === "entregado"
                            ? "bg-green-100 text-green-800"
                            : p.estado === "cancelado"
                              ? "bg-red-100 text-red-800"
                              : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {ESTADOS[p.estado] ?? p.estado}
                    </span>
                    <p className="font-black text-[var(--ca-orange)]">
                      ${total.toLocaleString("es-CO")}
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronUp size={20} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <User size={16} />
                          {p.nombre_cliente}
                        </p>
                        <p className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone size={16} />
                          {p.telefono}
                        </p>
                        <p className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin size={16} />
                          {p.direccion}
                        </p>
                        {p.notas && (
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">Notas:</span>{" "}
                            {p.notas}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-bold text-slate-700">
                          Productos
                        </p>
                        <ul className="space-y-1 text-sm">
                          {items(p).map((item, i) => (
                            <li
                              key={i}
                              className="flex justify-between text-slate-600"
                            >
                              <span>
                                {item.nombre} ({item.presentacion}) x
                                {item.cantidad}
                              </span>
                              <span className="font-semibold">
                                $
                                {(typeof item.subtotal === "string"
                                  ? parseFloat(item.subtotal)
                                  : item.subtotal
                                ).toLocaleString("es-CO")}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-right font-black text-[var(--ca-orange)]">
                          Total: ${total.toLocaleString("es-CO")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
                      <FacturaImprimir pedido={p} />
                      <button
                        type="button"
                        onClick={() => handlePendiente(p.id)}
                        disabled={loading === p.id || p.estado === "pendiente"}
                        className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-800 hover:bg-amber-200 disabled:opacity-50"
                      >
                        Pendiente
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDespachado(p.id, total)}
                        disabled={loading === p.id || p.estado === "despachado"}
                        className="rounded-lg bg-green-100 px-3 py-1.5 text-sm font-bold text-green-800 hover:bg-green-200 disabled:opacity-50"
                      >
                        Despachado
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRechazado(p.id)}
                        disabled={loading === p.id}
                        className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-bold text-red-800 hover:bg-red-200 disabled:opacity-50"
                      >
                        Rechazado
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
