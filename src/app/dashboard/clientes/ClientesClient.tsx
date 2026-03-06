"use client";

import {
  actualizarCliente,
  crearCliente,
  eliminarCliente,
} from "./actions";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import type { ClienteConEstadisticas } from "./page";

const ITEMS_POR_PAGINA = 10;

function toCSV(rows: (string | number)[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ClientesClient({
  clientes,
  puedeCrear = true,
}: {
  clientes: ClienteConEstadisticas[];
  puedeCrear?: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState<ClienteConEstadisticas | null>(null);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const term = busqueda.trim().toLowerCase();
  const filtrados = term
    ? clientes.filter(
        (c) =>
          (c.nombre ?? "").toLowerCase().includes(term) ||
          (c.telefono ?? "").toLowerCase().includes(term) ||
          (c.direccion ?? "").toLowerCase().includes(term)
      )
    : clientes;

  const totalPaginas = Math.ceil(filtrados.length / ITEMS_POR_PAGINA) || 1;
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const clientesPaginados = filtrados.slice(inicio, inicio + ITEMS_POR_PAGINA);

  async function handleActualizar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editando) return;
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const result = await actualizarCliente(
      editando.id,
      (form.nombre as HTMLInputElement).value,
      (form.telefono as HTMLInputElement).value,
      (form.direccion as HTMLInputElement).value || null
    );
    setLoading(false);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      setEditando(null);
    }
  }

  async function handleCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const result = await crearCliente(
      (form.nombre as HTMLInputElement).value,
      (form.telefono as HTMLInputElement).value,
      (form.direccion as HTMLInputElement).value || null
    );
    setLoading(false);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      setCreando(false);
      window.location.reload();
    }
  }

  async function handleEliminar(c: ClienteConEstadisticas) {
    if (!confirm(`¿Eliminar al cliente "${c.nombre}"? Solo se puede eliminar si no tiene pedidos pendientes o despachados.`)) return;
    setError(null);
    setLoading(true);
    const result = await eliminarCliente(c.id);
    setLoading(false);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      setPagina(1);
    }
  }

  function exportarCSV() {
    const rows = [
      ["Nombre", "Teléfono", "Dirección", "Pedidos", "Total comprado", "Registrado"],
      ...filtrados.map((c) => [
        c.nombre,
        c.telefono,
        c.direccion ?? "",
        c.pedidos,
        c.total_comprado.toFixed(2),
        new Date(c.created_at).toLocaleDateString("es-CO"),
      ]),
    ];
    toCSV(rows, `clientes_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--ca-purple)]">Clientes</h1>
          <p className="mt-2 text-slate-600">
            Listado de todos los clientes que han realizado compras
          </p>
        </div>
        <div className="flex gap-2">
          {puedeCrear && (
            <button
              onClick={() => setCreando(true)}
              className="flex items-center gap-2 rounded-xl bg-[var(--ca-purple)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              <Plus size={18} />
              Crear cliente
            </button>
          )}
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <Download size={18} />
            Exportar CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o dirección..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPagina(1);
          }}
          className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--ca-purple)] focus:ring-2 focus:ring-[var(--ca-purple)]/20"
        />
      </div>

      {clientes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
          <User size={48} className="mx-auto text-slate-300" />
          <p className="mt-4 font-medium text-slate-600">No hay clientes registrados</p>
          <p className="mt-1 text-sm text-slate-500">
            Los clientes se crean automáticamente cuando realizan un pedido
          </p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="font-medium text-slate-600">No se encontraron clientes</p>
          <p className="mt-1 text-sm text-slate-500">Prueba con otro término de búsqueda</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-bold text-slate-600">Cliente</th>
                  <th className="px-4 py-3 text-sm font-bold text-slate-600">Teléfono</th>
                  <th className="hidden px-4 py-3 text-sm font-bold text-slate-600 md:table-cell">Dirección</th>
                  <th className="px-4 py-3 text-sm font-bold text-slate-600 text-right">Pedidos</th>
                  <th className="px-4 py-3 text-sm font-bold text-slate-600 text-right">Total comprado</th>
                  <th className="px-4 py-3 text-sm font-bold text-slate-600 w-24">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesPaginados.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-slate-100 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ca-purple)]/10 text-[var(--ca-purple)]">
                          <User size={20} />
                        </div>
                        <span className="font-semibold text-slate-800">{c.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://wa.me/57${c.telefono.replace(/\D/g, "").slice(-10)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-slate-600 hover:text-[var(--ca-purple)]"
                      >
                        <Phone size={14} />
                        {c.telefono}
                      </a>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {c.direccion ? (
                        <span className="flex items-center gap-1.5 text-sm text-slate-600">
                          <MapPin size={14} className="shrink-0" />
                          {c.direccion}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700">
                      {c.pedidos}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-[var(--ca-orange)]">
                      ${c.total_comprado.toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditando(c)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[var(--ca-purple)]"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(c)}
                          disabled={loading}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtrados.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Mostrando {inicio + 1}-{Math.min(inicio + ITEMS_POR_PAGINA, filtrados.length)} de {filtrados.length} clientes
          </p>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaActual <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Página anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="min-w-[100px] text-center text-sm font-medium text-slate-600">
                Página {paginaActual} de {totalPaginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual >= totalPaginas}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Página siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {creando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => { setCreando(false); setError(null); }}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-black text-[var(--ca-purple)]">Crear cliente</h2>
            <form onSubmit={handleCrear} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Nombre *</label>
                <input
                  name="nombre"
                  type="text"
                  required
                  maxLength={120}
                  placeholder="Nombre completo"
                  className="h-11 w-full rounded-xl border border-slate-200 px-4"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Teléfono *</label>
                <input
                  name="telefono"
                  type="tel"
                  required
                  maxLength={20}
                  placeholder="300 123 4567"
                  className="h-11 w-full rounded-xl border border-slate-200 px-4"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Dirección</label>
                <textarea
                  name="direccion"
                  rows={3}
                  maxLength={300}
                  placeholder="Dirección de entrega"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setCreando(false); setError(null); }}
                  className="flex-1 rounded-xl border-2 border-slate-200 py-2.5 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-[var(--ca-purple)] py-2.5 font-bold text-white disabled:opacity-60"
                >
                  {loading ? "Creando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => { setEditando(null); setError(null); }}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-black text-[var(--ca-purple)]">Editar cliente</h2>
            <form onSubmit={handleActualizar} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Nombre *</label>
                <input
                  name="nombre"
                  type="text"
                  defaultValue={editando.nombre}
                  required
                  maxLength={120}
                  className="h-11 w-full rounded-xl border border-slate-200 px-4"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Teléfono *</label>
                <input
                  name="telefono"
                  type="tel"
                  defaultValue={editando.telefono}
                  required
                  maxLength={20}
                  className="h-11 w-full rounded-xl border border-slate-200 px-4"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Dirección</label>
                <textarea
                  name="direccion"
                  defaultValue={editando.direccion ?? ""}
                  rows={3}
                  maxLength={300}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setEditando(null); setError(null); }}
                  className="flex-1 rounded-xl border-2 border-slate-200 py-2.5 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-[var(--ca-purple)] py-2.5 font-bold text-white disabled:opacity-60"
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
