"use client";

import { BarChart3, Download, Package, ShoppingBag, TrendingUp, UserCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

type PedidosPorEstado = Record<string, number>;
type TopProducto = { nombre: string; cantidad: number; subtotal: number };
type VentasPorDia = { fecha: string; total: number };
type TopCliente = { nombre: string; telefono: string; pedidos: number; total: number };
type VendedorVentas = {
  vendedor_id: string | null;
  nombre: string;
  email: string;
  porcentaje: number;
  ventas: number;
  comision: number;
  pedidos: number;
};
type Kpi = { label: string; value: string; sub?: string | null; icon: string; color: string };

const ICON_MAP = {
  BarChart3,
  Package,
  ShoppingBag,
  TrendingUp,
  UserCircle,
} as const;

type Props = {
  fechaDesde: string;
  fechaHasta: string;
  kpis: Kpi[];
  pedidosPorEstado: PedidosPorEstado;
  labelsEstado: Record<string, string>;
  topProductos: TopProducto[];
  ventasPorDia: VentasPorDia[];
  topClientes: TopCliente[];
  clientesRecurrentes: TopCliente[];
  ventasPorVendedor: VendedorVentas[];
  totalComisiones: number;
  ventasRangoTotal: number;
  ventasMesAnteriorTotal: number;
  variacionPorcentaje: number;
};

const COLORES_ESTADO: Record<string, string> = {
  pendiente: "bg-amber-400",
  confirmado: "bg-blue-400",
  enviado: "bg-indigo-400",
  despachado: "bg-green-500",
  entregado: "bg-emerald-600",
  cancelado: "bg-red-400",
};

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

export function InformesClient({
  fechaDesde,
  fechaHasta,
  kpis,
  pedidosPorEstado,
  labelsEstado,
  topProductos,
  ventasPorDia,
  topClientes,
  clientesRecurrentes,
  ventasPorVendedor,
  totalComisiones,
  ventasRangoTotal,
  ventasMesAnteriorTotal,
  variacionPorcentaje,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const maxEstado = Math.max(...Object.values(pedidosPorEstado), 1);
  const maxVentas = Math.max(...ventasPorDia.map((v) => v.total), 1);

  function handleFiltro(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const desde = (fd.get("fechaDesde") as string) || fechaDesde;
    const hasta = (fd.get("fechaHasta") as string) || fechaHasta;
    const p = new URLSearchParams(searchParams.toString());
    p.set("fechaDesde", desde);
    p.set("fechaHasta", hasta);
    router.push(`/dashboard/informes?${p.toString()}`);
  }

  function exportarVentas() {
    const rows = [
      ["Fecha", "Total"],
      ...ventasPorDia.map((v) => [v.fecha, v.total.toFixed(2)]),
      ["", ""],
      ["Total período", ventasRangoTotal.toFixed(2)],
    ];
    toCSV(rows, `ventas_${fechaDesde}_${fechaHasta}.csv`);
  }

  function exportarProductos() {
    const rows = [
      ["#", "Producto", "Cantidad", "Subtotal"],
      ...topProductos.map((p, i) => [i + 1, p.nombre, p.cantidad, p.subtotal.toFixed(2)]),
    ];
    toCSV(rows, `productos_mas_vendidos_${fechaDesde}_${fechaHasta}.csv`);
  }

  function exportarClientes() {
    const rows = [
      ["#", "Cliente", "Teléfono", "Pedidos", "Total"],
      ...topClientes.map((c, i) => [i + 1, c.nombre, c.telefono, c.pedidos, c.total.toFixed(2)]),
    ];
    toCSV(rows, `top_clientes_${fechaDesde}_${fechaHasta}.csv`);
  }

  function exportarCierreCaja() {
    const vendedoresConComision = ventasPorVendedor.filter((v) => v.vendedor_id && v.comision > 0);
    const rows = [
      ["Vendedor", "Email", "Ventas facturadas", "Comisión (%)", "A pagar"],
      ...vendedoresConComision.map((v) => [
        v.nombre,
        v.email,
        v.ventas.toFixed(2),
        `${v.porcentaje}%`,
        v.comision.toFixed(2),
      ]),
      ["", "", "", "Total a pagar", totalComisiones.toFixed(2)],
    ];
    toCSV(rows, `cierre_caja_${fechaDesde}_${fechaHasta}.csv`);
  }

  return (
    <div className="mt-6 space-y-8">
      {/* Filtro por fechas */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-slate-700">Filtrar por período</h2>
        <form onSubmit={handleFiltro} className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="fechaDesde" className="mb-1 block text-xs font-medium text-slate-600">
              Desde
            </label>
            <input
              id="fechaDesde"
              name="fechaDesde"
              type="date"
              defaultValue={fechaDesde}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--ca-purple)]"
            />
          </div>
          <div>
            <label htmlFor="fechaHasta" className="mb-1 block text-xs font-medium text-slate-600">
              Hasta
            </label>
            <input
              id="fechaHasta"
              name="fechaHasta"
              type="date"
              defaultValue={fechaHasta}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--ca-purple)]"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-[var(--ca-purple)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
          >
            Aplicar
          </button>
        </form>
      </section>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = ICON_MAP[kpi.icon as keyof typeof ICON_MAP] ?? BarChart3;
          return (
            <div key={kpi.label} className={`rounded-2xl ${kpi.color} p-4 shadow-sm`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">{kpi.label}</span>
                <Icon className="text-[var(--ca-purple)]" size={24} />
              </div>
              <p className="mt-2 text-2xl font-black text-[var(--ca-purple)]">{kpi.value}</p>
              {kpi.sub && <p className="mt-1 text-xs font-medium text-slate-500">{kpi.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* Comparativa mes actual vs anterior */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-800">Comparativa con mes anterior</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">Ventas en período seleccionado</p>
            <p className="mt-1 text-2xl font-black text-[var(--ca-purple)]">
              ${ventasRangoTotal.toLocaleString("es-CO")}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">Ventas mes anterior</p>
            <p className="mt-1 text-2xl font-black text-slate-700">
              ${ventasMesAnteriorTotal.toLocaleString("es-CO")}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-sm font-bold ${
              variacionPorcentaje >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {variacionPorcentaje >= 0 ? "+" : ""}
            {variacionPorcentaje.toFixed(1)}%
          </span>
          <span className="text-sm text-slate-600">
            {variacionPorcentaje >= 0 ? "Crecimiento" : "Disminución"} respecto al mes anterior
          </span>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Pedidos por estado */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-800">Pedidos por estado</h2>
          <div className="space-y-3">
            {Object.entries(pedidosPorEstado).map(([estado, count]) => (
              <div key={estado} className="flex items-center gap-3">
                <span className="w-28 text-sm font-medium text-slate-600">
                  {labelsEstado[estado] ?? estado}
                </span>
                <div className="flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-7 ${COLORES_ESTADO[estado] ?? "bg-slate-400"} rounded-full transition-all`}
                    style={{ width: `${(count / maxEstado) * 100}%`, minWidth: count > 0 ? "24px" : "0" }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-bold text-slate-700">{count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Productos más vendidos */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Top 10 productos más vendidos</h2>
            <button
              onClick={exportarProductos}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Download size={14} />
              CSV
            </button>
          </div>
          {topProductos.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No hay datos de ventas aún</p>
          ) : (
            <div className="space-y-2">
              {topProductos.map((p, i) => (
                <div
                  key={p.nombre}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ca-purple)]/20 text-xs font-bold text-[var(--ca-purple)]">
                      {i + 1}
                    </span>
                    <span className="line-clamp-1 text-sm font-medium text-slate-800">{p.nombre}</span>
                  </span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-bold text-slate-700">{p.cantidad} ud</span>
                    <span className="font-black text-[var(--ca-orange)]">
                      ${p.subtotal.toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top clientes */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Top 15 clientes por compras</h2>
            <button
              onClick={exportarClientes}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Download size={14} />
              CSV
            </button>
          </div>
          {topClientes.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No hay datos de ventas aún</p>
          ) : (
            <div className="space-y-2">
              {topClientes.map((c, i) => (
                <div
                  key={c.telefono}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ca-orange)]/20 text-xs font-bold text-[var(--ca-orange)]">
                      {i + 1}
                    </span>
                    <div>
                      <span className="block text-sm font-medium text-slate-800">{c.nombre}</span>
                      <span className="text-xs text-slate-500">{c.telefono}</span>
                    </div>
                  </span>
                  <div className="text-right">
                    <span className="block font-bold text-slate-700">{c.pedidos} pedido{c.pedidos !== 1 ? "s" : ""}</span>
                    <span className="font-black text-[var(--ca-orange)]">
                      ${c.total.toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Clientes recurrentes */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-800">Clientes recurrentes (2+ pedidos)</h2>
          {clientesRecurrentes.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No hay clientes con más de un pedido en el período
            </p>
          ) : (
            <div className="space-y-2">
              {clientesRecurrentes.map((c) => (
                <div
                  key={c.telefono}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-emerald-50/50 px-3 py-2"
                >
                  <span className="text-sm font-medium text-slate-800">{c.nombre}</span>
                  <span className="text-xs text-slate-500">{c.telefono}</span>
                  <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
                    {c.pedidos} pedidos · ${c.total.toLocaleString("es-CO")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Cierre de caja por vendedor */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            Cierre de caja por vendedor ({fechaDesde} a {fechaHasta})
          </h2>
          {ventasPorVendedor.some((v) => v.comision > 0) && (
            <button
              onClick={exportarCierreCaja}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Download size={14} />
              Exportar CSV
            </button>
          )}
        </div>
        {ventasPorVendedor.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No hay ventas en el período seleccionado</p>
        ) : (
          <div className="space-y-4">
            {ventasPorVendedor.map((v) => (
              <div
                key={v.vendedor_id ?? "directa"}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-800">{v.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {v.email && <span>{v.email}</span>}
                    {v.email && (v.pedidos > 0 || v.porcentaje > 0) && " · "}
                    {v.pedidos} pedido{v.pedidos !== 1 ? "s" : ""}
                    {v.porcentaje > 0 && ` · ${v.porcentaje}% comisión`}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-xs text-slate-500">Ventas</p>
                    <p className="font-bold text-slate-800">${v.ventas.toLocaleString("es-CO")}</p>
                  </div>
                  {v.comision > 0 && (
                    <div>
                      <p className="text-xs text-slate-500">Comisión</p>
                      <p className="font-black text-[var(--ca-orange)]">${v.comision.toLocaleString("es-CO")}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {totalComisiones > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-[var(--ca-purple)]/10 px-4 py-3">
                <span className="font-bold text-slate-800">Total a pagar (comisiones)</span>
                <span className="text-xl font-black text-[var(--ca-purple)]">${totalComisiones.toLocaleString("es-CO")}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Ventas por día */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            Ventas por día ({fechaDesde} a {fechaHasta})
          </h2>
          <button
            onClick={exportarVentas}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <Download size={14} />
            Exportar CSV
          </button>
        </div>
        {ventasPorDia.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No hay ventas en el período seleccionado</p>
        ) : (
          <div className="flex items-end gap-1 overflow-x-auto pb-2">
            {ventasPorDia.map((v) => (
              <div key={v.fecha} className="flex min-w-[48px] flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-slate-500">
                  {new Date(v.fecha + "T12:00:00").toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <div
                  className="w-full min-h-[4px] rounded-t bg-[var(--ca-purple)] transition-all"
                  style={{ height: `${Math.max(4, (v.total / maxVentas) * 120)}px` }}
                  title={`$${v.total.toLocaleString("es-CO")}`}
                />
                <span className="text-[10px] font-bold text-slate-600">
                  ${(v.total / 1000).toFixed(0)}k
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
