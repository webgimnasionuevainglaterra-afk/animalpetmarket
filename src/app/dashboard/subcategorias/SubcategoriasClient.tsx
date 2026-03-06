"use client";

import {
  crearSubcategoria,
  actualizarSubcategoria,
  eliminarSubcategoria,
  type Subcategoria,
} from "./actions";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type Categoria = { id: string; nombre: string };

export function SubcategoriasClient({
  subcategorias,
  categorias,
}: {
  subcategorias: (Subcategoria & { categorias?: { nombre: string } | null })[];
  categorias: Categoria[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await crearSubcategoria(formData);
    setLoading(false);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      form.reset();
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await actualizarSubcategoria(id, formData);
    setLoading(false);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      setEditingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta subcategoría?")) return;
    setError(null);
    setLoading(true);
    const result = await eliminarSubcategoria(id);
    setLoading(false);
    if ("error" in result && result.error) setError(result.error);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[var(--ca-purple)]">
        Subcategorías
      </h1>
      <p className="text-slate-600">
        Las subcategorías pertenecen a una categoría. Ej: Perro → Alimentos,
        Juguetes; Gato → Arena, Comedores.
      </p>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      {categorias.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Primero crea al menos una categoría en{" "}
          <a href="/dashboard/categorias" className="font-bold underline">
            Categorías
          </a>
          .
        </div>
      ) : (
        <>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[200px] flex-1">
                <label
                  htmlFor="nombre"
                  className="mb-1 block text-sm font-bold text-slate-700"
                >
                  Nombre
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  placeholder="Ej: Alimentos, Juguetes, Arena..."
                  required
                  disabled={loading}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-800 outline-none transition focus:border-[var(--ca-purple)] focus:ring-2 focus:ring-[var(--ca-purple)]/20 disabled:opacity-60"
                />
              </div>
              <div className="min-w-[200px]">
                <label
                  htmlFor="categoria_id"
                  className="mb-1 block text-sm font-bold text-slate-700"
                >
                  Categoría
                </label>
                <select
                  id="categoria_id"
                  name="categoria_id"
                  required
                  disabled={loading}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-800 outline-none transition focus:border-[var(--ca-purple)] focus:ring-2 focus:ring-[var(--ca-purple)]/20 disabled:opacity-60"
                >
                  <option value="">Selecciona categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex h-11 items-center gap-2 rounded-xl bg-[var(--ca-purple)] px-5 font-bold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                <Plus size={18} />
                Agregar
              </button>
            </div>
          </form>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-bold text-slate-600">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-sm font-bold text-slate-600">
                    Subcategoría
                  </th>
                  <th className="w-24 px-4 py-3 text-right text-sm font-bold text-slate-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {subcategorias.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No hay subcategorías. Agrega la primera arriba.
                    </td>
                  </tr>
                ) : (
                  subcategorias.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-t border-slate-100 hover:bg-slate-50/50"
                    >
                      {editingId === sub.id ? (
                        <td colSpan={2} className="px-4 py-3">
                          <form
                            onSubmit={(e) => handleUpdate(e, sub.id)}
                            className="flex flex-wrap items-center gap-3"
                          >
                            <select
                              name="categoria_id"
                              required
                              disabled={loading}
                              defaultValue={sub.categoria_id}
                              className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[var(--ca-purple)]"
                            >
                              {categorias.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.nombre}
                                </option>
                              ))}
                            </select>
                            <input
                              name="nombre"
                              type="text"
                              defaultValue={sub.nombre}
                              required
                              disabled={loading}
                              placeholder="Subcategoría"
                              className="h-9 min-w-[120px] rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[var(--ca-purple)]"
                              autoFocus
                            />
                            <button
                              type="submit"
                              disabled={loading}
                              className="rounded-lg bg-[var(--ca-purple)] px-3 py-1.5 text-xs font-bold text-white"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600"
                            >
                              Cancelar
                            </button>
                          </form>
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-slate-700">
                            {sub.categorias?.nombre ?? "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-800">
                              {sub.nombre}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 text-right">
                        {editingId !== sub.id && (
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setEditingId(sub.id)}
                              disabled={loading}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-[var(--ca-purple)]"
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(sub.id)}
                              disabled={loading}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-red-100 hover:text-red-600"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
