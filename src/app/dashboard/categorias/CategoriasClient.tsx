"use client";

import {
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  type Categoria,
} from "./actions";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export function CategoriasClient({
  categorias,
}: {
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
    const result = await crearCategoria(formData);
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
    const result = await actualizarCategoria(id, formData);
    setLoading(false);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      setEditingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta categoría?")) return;
    setError(null);
    setLoading(true);
    const result = await eliminarCategoria(id);
    setLoading(false);
    if ("error" in result && result.error) setError(result.error);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[var(--ca-purple)]">
        Categorías
      </h1>
      <p className="text-slate-600">
        Gestiona las categorías principales (Perro, Gato, etc.). Luego podrás
        agregar subcategorías y productos.
      </p>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
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
              placeholder="Ej: Perro, Gato, Pájaros..."
              required
              disabled={loading}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-800 outline-none transition focus:border-[var(--ca-purple)] focus:ring-2 focus:ring-[var(--ca-purple)]/20 disabled:opacity-60"
            />
          </div>
          <div className="min-w-[200px]">
            <label
              htmlFor="imagen"
              className="mb-1 block text-sm font-bold text-slate-700"
            >
              Foto (opcional)
            </label>
            <input
              id="imagen"
              name="imagen"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={loading}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--ca-purple)] file:px-4 file:py-2 file:font-bold file:text-white file:hover:brightness-110"
            />
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

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-16 px-4 py-3 text-sm font-bold text-slate-600">
                Foto
              </th>
              <th className="px-4 py-3 text-sm font-bold text-slate-600">
                Nombre
              </th>
              <th className="w-24 px-4 py-3 text-right text-sm font-bold text-slate-600">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {categorias.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                  No hay categorías. Agrega la primera arriba.
                </td>
              </tr>
            ) : (
              categorias.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-t border-slate-100 hover:bg-slate-50/50"
                >
                  <td className="px-4 py-3">
                    {cat.imagen ? (
                      <img
                        src={cat.imagen}
                        alt={cat.nombre}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200 text-slate-400 text-xs">
                        Sin foto
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === cat.id ? (
                      <form
                        onSubmit={(e) => handleUpdate(e, cat.id)}
                        className="flex flex-wrap items-center gap-3"
                      >
                        <div className="flex items-center gap-3">
                          {cat.imagen && (
                            <img
                              src={cat.imagen}
                              alt={cat.nombre}
                              className="h-14 w-14 rounded-lg object-cover border border-slate-200"
                            />
                          )}
                          <div className="flex flex-col gap-1">
                            <input
                            name="nombre"
                            type="text"
                            defaultValue={cat.nombre}
                            required
                            disabled={loading}
                            className="h-9 min-w-[140px] rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[var(--ca-purple)]"
                            autoFocus
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                              <input
                                name="imagen"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                disabled={loading}
                                className="hidden"
                              />
                              Cambiar foto
                            </label>
                            {cat.imagen && (
                              <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100">
                                <input
                                  name="quitar_foto"
                                  type="checkbox"
                                  value="1"
                                  disabled={loading}
                                  className="hidden"
                                />
                                Quitar foto
                              </label>
                            )}
                          </div>
                          </div>
                        </div>
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
                    ) : (
                      <span className="font-semibold text-slate-800">
                        {cat.nombre}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId !== cat.id && (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditingId(cat.id)}
                          disabled={loading}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-[var(--ca-purple)]"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
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
    </div>
  );
}
