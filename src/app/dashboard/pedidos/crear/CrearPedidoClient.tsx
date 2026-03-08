"use client";

import { crearPedidoDesdeDashboard, validarCupon } from "@/app/checkout/actions";
import { aplicarIva, resolverIvaPorcentaje } from "@/lib/iva";
import { ArrowLeft, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Cliente = { id: string; nombre: string; telefono: string; direccion: string | null };
type Producto = {
  id: string;
  nombre: string;
  aplica_iva: boolean;
  iva_porcentaje?: number | null;
  producto_presentaciones: Array<{ id: string; nombre: string; precio: number; aplica_iva: boolean; iva_porcentaje?: number | null }>;
};

type ItemCarrito = {
  productId: string;
  nombre: string;
  presentacion: string;
  precio: number;
  cantidad: number;
  aplica_iva: boolean;
  iva_porcentaje: number;
};

export function CrearPedidoClient({
  clientes,
  productos,
}: {
  clientes: Cliente[];
  productos: Producto[];
}) {
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [notas, setNotas] = useState("");
  const [cuponCodigo, setCuponCodigo] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState<{ porcentaje: number } | null>(null);
  const [cuponError, setCuponError] = useState<string | null>(null);
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [busquedaProd, setBusquedaProd] = useState("");
  const [prodSeleccionado, setProdSeleccionado] = useState<{ prod: Producto; pp: Producto["producto_presentaciones"][0] } | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productosConPresentaciones = productos.filter(
    (p) => p.producto_presentaciones && p.producto_presentaciones.length > 0
  );
  const productosFiltrados = busquedaProd.trim()
    ? productosConPresentaciones.filter((p) => p.nombre.toLowerCase().includes(busquedaProd.trim().toLowerCase()))
    : productosConPresentaciones.slice(0, 20);

  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const descuento = cuponAplicado ? subtotal * (cuponAplicado.porcentaje / 100) : 0;
  const total = subtotal - descuento;

  function agregarItem() {
    if (!prodSeleccionado || cantidad < 1) return;
    const { prod, pp } = prodSeleccionado;
    const ivaPorcentaje = resolverIvaPorcentaje({
      ivaPorcentaje: pp.iva_porcentaje,
      aplicaIva: pp.aplica_iva,
      fallbackPorcentaje: prod.iva_porcentaje,
      fallbackAplicaIva: prod.aplica_iva,
    });
    const precio = aplicarIva(pp.precio, ivaPorcentaje);
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === prod.id && i.presentacion === pp.nombre);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].cantidad += cantidad;
        return next;
      }
      return [...prev, { productId: prod.id, nombre: prod.nombre, presentacion: pp.nombre, precio, cantidad, aplica_iva: ivaPorcentaje > 0, iva_porcentaje: ivaPorcentaje }];
    });
    setProdSeleccionado(null);
    setCantidad(1);
  }

  function quitarItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleAplicarCupon() {
    setCuponError(null);
    if (!cuponCodigo.trim()) return;
    const res = await validarCupon(cuponCodigo);
    if (res.valid) {
      setCuponAplicado({ porcentaje: res.porcentaje });
    } else {
      setCuponAplicado(null);
      setCuponError(res.error ?? "Cupón inválido");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!cliente) {
      setError("Selecciona un cliente");
      return;
    }
    if (items.length === 0) {
      setError("Agrega al menos un producto");
      return;
    }
    setLoading(true);
    const result = await crearPedidoDesdeDashboard(
      cliente.nombre,
      cliente.telefono,
      cliente.direccion || "",
      notas.trim() || null,
      items.map((i) => ({
        productId: i.productId,
        nombre: i.nombre,
        presentacion: i.presentacion,
        precio: i.precio,
        cantidad: i.cantidad,
        aplica_iva: i.aplica_iva,
        iva_porcentaje: i.iva_porcentaje,
      })),
      cuponAplicado ? cuponCodigo.trim() : null
    );
    setLoading(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    if ("success" in result && result.success && result.pedidoId) {
      const token = result.tokenFactura ? `?token=${encodeURIComponent(result.tokenFactura)}` : "";
      router.push(`/pedido/${result.pedidoId}${token}`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/pedidos"
          className="flex items-center gap-2 text-sm font-semibold text-[var(--ca-purple)] hover:underline"
        >
          <ArrowLeft size={18} />
          Volver a pedidos
        </Link>
      </div>

      <h1 className="text-2xl font-black text-[var(--ca-purple)]">Crear pedido</h1>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">Cliente *</label>
          <select
            value={cliente?.id ?? ""}
            onChange={(e) => {
              const c = clientes.find((x) => x.id === e.target.value);
              setCliente(c ?? null);
            }}
            required
            className="w-full max-w-md rounded-xl border border-slate-200 px-4 py-2.5"
          >
            <option value="">Selecciona un cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} — {c.telefono}
              </option>
            ))}
          </select>
          {clientes.length === 0 && (
            <p className="mt-2 text-sm text-amber-600">
              No hay clientes. <Link href="/dashboard/clientes" className="underline">Crea uno primero</Link>.
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">Agregar productos</label>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={busquedaProd}
                onChange={(e) => setBusquedaProd(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4"
              />
            </div>
            <select
              value={prodSeleccionado ? `${prodSeleccionado.prod.id}::${prodSeleccionado.pp.nombre}` : ""}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) { setProdSeleccionado(null); return; }
                const [pid, pnom] = v.split("::");
                const prod = productos.find((p) => p.id === pid);
                if (!prod) return;
                const pp = prod.producto_presentaciones?.find((x) => x.nombre === pnom);
                if (pp) setProdSeleccionado({ prod, pp });
              }}
              className="rounded-xl border border-slate-200 px-4 py-2.5"
            >
              <option value="">Producto + presentación</option>
              {productosFiltrados.map((p) =>
                (p.producto_presentaciones ?? []).map((pp) => (
                  <option key={`${p.id}-${pp.nombre}`} value={`${p.id}::${pp.nombre}`}>
                    {p.nombre} — {pp.nombre} (${aplicarIva(
                      pp.precio,
                      resolverIvaPorcentaje({
                        ivaPorcentaje: pp.iva_porcentaje,
                        aplicaIva: pp.aplica_iva,
                        fallbackPorcentaje: p.iva_porcentaje,
                        fallbackAplicaIva: p.aplica_iva,
                      })
                    ).toLocaleString("es-CO")})
                  </option>
                ))
              )}
            </select>
            <input
              type="number"
              min={1}
              max={999}
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value, 10) || 1)}
              className="w-20 rounded-xl border border-slate-200 px-3 py-2.5 text-center"
            />
            <button
              type="button"
              onClick={agregarItem}
              disabled={!prodSeleccionado}
              className="flex items-center gap-2 rounded-xl bg-[var(--ca-purple)] px-4 py-2.5 font-bold text-white disabled:opacity-50"
            >
              <Plus size={18} />
              Agregar
            </button>
          </div>
        </div>

        {items.length > 0 && (
          <div className="rounded-xl border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-bold text-slate-600">Producto</th>
                  <th className="px-4 py-2 text-right text-sm font-bold text-slate-600">Precio</th>
                  <th className="px-4 py-2 text-center text-sm font-bold text-slate-600">Cant.</th>
                  <th className="px-4 py-2 text-right text-sm font-bold text-slate-600">Subtotal</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {items.map((i, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="px-4 py-2">{i.nombre} ({i.presentacion})</td>
                    <td className="px-4 py-2 text-right">${i.precio.toLocaleString("es-CO")}</td>
                    <td className="px-4 py-2 text-center">{i.cantidad}</td>
                    <td className="px-4 py-2 text-right font-bold">${(i.precio * i.cantidad).toLocaleString("es-CO")}</td>
                    <td>
                      <button type="button" onClick={() => quitarItem(idx)} className="p-2 text-red-500 hover:bg-red-50">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Cupón</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cuponCodigo}
                onChange={(e) => { setCuponCodigo(e.target.value.toUpperCase()); setCuponAplicado(null); setCuponError(null); }}
                placeholder="Código"
                maxLength={6}
                className="w-24 rounded-lg border border-slate-200 px-3 py-2 font-mono uppercase"
              />
              <button type="button" onClick={handleAplicarCupon} className="rounded-lg border border-[var(--ca-purple)] px-3 py-2 text-sm font-bold text-[var(--ca-purple)]">
                Aplicar
              </button>
            </div>
            {cuponError && <p className="mt-1 text-sm text-red-600">{cuponError}</p>}
            {cuponAplicado && <p className="mt-1 text-sm text-green-600">-{cuponAplicado.porcentaje}%</p>}
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Notas</label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas del pedido"
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <p className="text-xl font-black text-[var(--ca-orange)]">
            Total: ${total.toLocaleString("es-CO")}
          </p>
          <button
            type="submit"
            disabled={loading || !cliente || items.length === 0}
            className="rounded-xl bg-[var(--ca-purple)] px-8 py-3 font-bold text-white disabled:opacity-50"
          >
            {loading ? "Creando…" : "Crear pedido"}
          </button>
        </div>
      </form>
    </div>
  );
}
