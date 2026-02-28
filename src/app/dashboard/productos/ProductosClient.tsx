"use client";

import {
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  type Producto,
  type ProductoPresentacion,
} from "./actions";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { ProductoForm } from "./ProductoForm";

type Subcategoria = { id: string; nombre: string; categoria_id: string };
type Categoria = { id: string; nombre: string };
type ProductoRow = Producto & {
  stock?: number;
  subcategorias?:
    | { nombre: string; categorias?: { nombre: string } | { nombre: string }[] }
    | { nombre: string; categorias?: { nombre: string } | { nombre: string }[] }[]
    | null;
  producto_presentaciones?: ProductoPresentacion[] | null;
};

function getSubcatName(p: ProductoRow) {
  const s = p.subcategorias;
  if (!s) return "-";
  const sub = Array.isArray(s) ? s[0] : s;
  const cat = sub?.categorias;
  const catObj = Array.isArray(cat) ? cat[0] : cat;
  return catObj ? `${(catObj as { nombre: string }).nombre} → ${sub?.nombre}` : sub?.nombre ?? "-";
}

export function ProductosClient({
  productos,
  categorias,
  subcategorias,
}: {
  productos: ProductoRow[];
  categorias: Categoria[];
  subcategorias: Subcategoria[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  async function handleCreate(formData: FormData) {
    setLoading(true);
    const result = await crearProducto(formData);
    setLoading(false);
    if (result.success) setCreating(false);
    return result;
  }

  async function handleUpdate(id: string, formData: FormData) {
    setLoading(true);
    const result = await actualizarProducto(id, formData);
    setLoading(false);
    if (result.success) setEditingId(null);
    return result;
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    setLoading(true);
    await eliminarProducto(id);
    setLoading(false);
  }

  const prod = productos.find((p) => p.id === editingId);

  const term = busqueda.trim().toLowerCase();
  const productosFiltrados = term
    ? productos.filter((p) => {
        const nombre = (p.nombre ?? "").toLowerCase();
        const desc = (p.descripcion ?? "").toLowerCase();
        const subcat = getSubcatName(p).toLowerCase();
        return (
          nombre.includes(term) ||
          desc.includes(term) ||
          subcat.includes(term)
        );
      })
    : productos;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--ca-purple)]">
            Productos
          </h1>
          <p className="text-slate-600">
            Crea productos y selecciona qué datos registrar (medicamento,
            alimento, juguete, logística, marketing).
          </p>
        </div>
        {!creating && !editingId && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--ca-purple)] px-5 py-2.5 font-bold text-white"
          >
            <Plus size={18} />
            Nuevo producto
          </button>
        )}
      </div>

      {(creating || editingId) && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="mb-4 font-bold text-slate-700">
            {editingId ? "Editar producto" : "Nuevo producto"}
          </h2>
          <ProductoForm
            categorias={categorias}
            subcategorias={subcategorias}
            producto={
              prod
                ? {
                    nombre: prod.nombre,
                    descripcion: prod.descripcion,
                    precio: typeof prod.precio === "string" ? parseFloat(prod.precio) : Number(prod.precio),
                    aplica_iva: (prod as { aplica_iva?: boolean }).aplica_iva !== false,
                    imagen: prod.imagen,
                    subcategoria_id: prod.subcategoria_id,
                    peso: prod.peso ? Number(prod.peso) : null,
                    dimensiones: prod.dimensiones,
                    requiere_refrigeracion: prod.requiere_refrigeracion,
                    producto_fragil: prod.producto_fragil,
                    destacado: prod.destacado,
                    nuevo: prod.nuevo,
                    mas_vendido: prod.mas_vendido,
                    recomendado: prod.recomendado,
                    porcentaje_oferta: prod.porcentaje_oferta ?? null,
                    secciones_activas: prod.secciones_activas ?? [],
                    datos_medicamento: prod.datos_medicamento,
                    datos_alimento: prod.datos_alimento,
                    datos_juguete: prod.datos_juguete,
                  }
                : undefined
            }
            presentaciones={
              Array.isArray(prod?.producto_presentaciones)
                ? prod.producto_presentaciones
                : []
            }
            onSubmit={editingId ? (fd) => handleUpdate(editingId, fd) : handleCreate}
            onCancel={() => {
              setCreating(false);
              setEditingId(null);
            }}
            loading={loading}
            submitLabel={editingId ? "Guardar" : "Crear producto"}
          />
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1 sm:max-w-sm">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, descripción o subcategoría..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--ca-purple)] focus:ring-2 focus:ring-[var(--ca-purple)]/20"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-bold text-slate-600">Producto</th>
              <th className="px-4 py-3 font-bold text-slate-600">Precio</th>
              <th className="px-4 py-3 font-bold text-slate-600">Stock</th>
              <th className="px-4 py-3 font-bold text-slate-600">Subcategoría</th>
              <th className="w-24 px-4 py-3 text-right font-bold text-slate-600">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  {term
                    ? "No se encontraron productos con esa búsqueda."
                    : "No hay productos. Crea el primero."}
                </td>
              </tr>
            ) : (
              productosFiltrados.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imagen && (
                        <img
                          src={p.imagen}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      )}
                      <span className="font-semibold">{p.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    ${Number(p.precio).toLocaleString("es-CO")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${
                        (p.stock ?? 0) === 0 ? "text-amber-600" : "text-slate-700"
                      }`}
                    >
                      {p.stock ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {getSubcatName(p)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditingId(p.id)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-[var(--ca-purple)]"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-100 hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
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
