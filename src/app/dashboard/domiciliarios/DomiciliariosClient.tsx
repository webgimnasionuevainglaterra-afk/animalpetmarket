"use client";

import { actualizarDomiciliario, crearDomiciliario, eliminarDomiciliario } from "./actions";
import { Bike, Download, Plus, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";

type Domiciliario = {
  id: string;
  nombre: string;
  placa: string;
  telefono: string;
  activo: boolean;
  created_at: string;
};

export function DomiciliariosClient({ domiciliarios }: { domiciliarios: Domiciliario[] }) {
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<Domiciliario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const result = await crearDomiciliario(
      (form.nombre as HTMLInputElement).value,
      (form.placa as HTMLInputElement).value,
      (form.telefono as HTMLInputElement).value
    );
    setLoading(false);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      setCreando(false);
      window.location.reload();
    }
  }

  async function handleActualizar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editando) return;
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const result = await actualizarDomiciliario(
      editando.id,
      (form.nombre as HTMLInputElement).value,
      (form.placa as HTMLInputElement).value,
      (form.telefono as HTMLInputElement).value,
      (form.activo as HTMLInputElement).checked
    );
    setLoading(false);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      setEditando(null);
      window.location.reload();
    }
  }

  async function handleEliminar(domiciliario: Domiciliario) {
    if (!confirm(`¿Eliminar al domiciliario "${domiciliario.nombre}"? También se eliminará su acceso al dashboard.`)) {
      return;
    }

    setError(null);
    setLoading(true);
    const result = await eliminarDomiciliario(domiciliario.id);
    setLoading(false);

    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      if (editando?.id === domiciliario.id) setEditando(null);
      window.location.reload();
    }
  }

  function exportarCSV() {
    const rows = [
      ["Nombre", "Placa", "Teléfono", "Estado", "Registrado"],
      ...domiciliarios.map((d) => [
        d.nombre,
        d.placa,
        d.telefono,
        d.activo ? "Activo" : "Inactivo",
        new Date(d.created_at).toLocaleDateString("es-CO"),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `domiciliarios_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-[var(--ca-purple)]">
            <Bike size={28} />
            Domiciliarios
          </h1>
          <p className="mt-2 text-slate-600">
            Gestiona los domiciliarios. Inician sesión con placa y teléfono.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCreando(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--ca-purple)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Plus size={18} />
            Crear domiciliario
          </button>
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

      {domiciliarios.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
          <Bike size={48} className="mx-auto text-slate-300" />
          <p className="mt-4 font-medium text-slate-600">No hay domiciliarios registrados</p>
          <p className="mt-1 text-sm text-slate-500">
            Crea un domiciliario para asignar pedidos a repartir
          </p>
          <button
            onClick={() => setCreando(true)}
            className="mt-4 rounded-xl bg-[var(--ca-purple)] px-6 py-2.5 font-bold text-white"
          >
            Crear domiciliario
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-sm font-bold text-slate-600">Nombre</th>
                <th className="px-4 py-3 text-sm font-bold text-slate-600">Placa</th>
                <th className="px-4 py-3 text-sm font-bold text-slate-600">Teléfono</th>
                <th className="px-4 py-3 text-sm font-bold text-slate-600">Estado</th>
                <th className="px-4 py-3 text-sm font-bold text-slate-600 w-28">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {domiciliarios.map((d) => (
                <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{d.nombre}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{d.placa}</td>
                  <td className="px-4 py-3 text-slate-600">{d.telefono}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        d.activo ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {d.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditando(d)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[var(--ca-purple)]"
                        title="Editar"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleEliminar(d)}
                        disabled={loading}
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
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
      )}

      {creando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => { setCreando(false); setError(null); }}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-black text-[var(--ca-purple)]">Crear domiciliario</h2>
            <p className="mt-1 text-sm text-slate-500">
              Iniciará sesión con placa (usuario) y teléfono (contraseña)
            </p>
            <form onSubmit={handleCrear} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Nombre *</label>
                <input name="nombre" type="text" required maxLength={120} placeholder="Nombre completo" className="h-11 w-full rounded-xl border border-slate-200 px-4" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Placa de la moto *</label>
                <input name="placa" type="text" required placeholder="ABC123" className="h-11 w-full rounded-xl border border-slate-200 px-4 uppercase" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Teléfono (contraseña) *</label>
                <input name="telefono" type="tel" required minLength={6} placeholder="3001234567" className="h-11 w-full rounded-xl border border-slate-200 px-4" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setCreando(false); setError(null); }} className="flex-1 rounded-xl border-2 border-slate-200 py-2.5 font-bold text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-[var(--ca-purple)] py-2.5 font-bold text-white disabled:opacity-60">
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
            <button type="button" onClick={() => { setEditando(null); setError(null); }} className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100">
              <X size={20} />
            </button>
            <h2 className="text-xl font-black text-[var(--ca-purple)]">Editar domiciliario</h2>
            <form onSubmit={handleActualizar} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Nombre *</label>
                <input name="nombre" type="text" required defaultValue={editando.nombre} maxLength={120} className="h-11 w-full rounded-xl border border-slate-200 px-4" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Placa *</label>
                <input name="placa" type="text" required defaultValue={editando.placa} className="h-11 w-full rounded-xl border border-slate-200 px-4 uppercase" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Teléfono (contraseña) *</label>
                <input name="telefono" type="tel" required minLength={6} defaultValue={editando.telefono} className="h-11 w-full rounded-xl border border-slate-200 px-4" />
              </div>
              <div className="flex items-center gap-2">
                <input name="activo" type="checkbox" defaultChecked={editando.activo} className="h-4 w-4 rounded border-slate-300" />
                <label className="text-sm font-semibold text-slate-700">Activo</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setEditando(null); setError(null); }} className="flex-1 rounded-xl border-2 border-slate-200 py-2.5 font-bold text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-[var(--ca-purple)] py-2.5 font-bold text-white disabled:opacity-60">
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
