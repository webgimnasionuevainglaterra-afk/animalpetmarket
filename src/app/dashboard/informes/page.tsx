import { createClient } from "@/lib/supabase/server";
import { InformesClient } from "./InformesClient";

const ESTADOS = [
  "pendiente",
  "confirmado",
  "enviado",
  "despachado",
  "entregado",
  "cancelado",
];

function getDefaultFechas() {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  return {
    hoy: hoy.toISOString().slice(0, 10),
    inicioMes: inicioMes.toISOString().slice(0, 10),
    inicioMesAnterior: new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().slice(0, 10),
    finMesAnterior: new Date(hoy.getFullYear(), hoy.getMonth(), 0).toISOString().slice(0, 10),
  };
}

export default async function InformesPage({
  searchParams,
}: {
  searchParams: Promise<{ fechaDesde?: string; fechaHasta?: string }>;
}) {
  const params = await searchParams;
  const { hoy, inicioMes, inicioMesAnterior, finMesAnterior } = getDefaultFechas();
  let fechaDesde = params.fechaDesde ?? inicioMes;
  let fechaHasta = params.fechaHasta ?? hoy;
  if (fechaDesde > fechaHasta) [fechaDesde, fechaHasta] = [fechaHasta, fechaDesde];

  const supabase = await createClient();

  const [
    { data: ventasHoy },
    { data: ventasRango },
    { data: ventasMesAnterior },
    { data: totalVentas },
    { count: pedidosCount },
    { data: pedidosPorEstado },
    { data: productosMasVendidos },
    { count: clientesCount },
    { data: ventasPorDiaData },
    { data: topClientesData },
    { data: ventasPorVendedorData },
  ] = await Promise.all([
    supabase.from("ventas").select("total").eq("fecha_venta", hoy),
    supabase
      .from("ventas")
      .select("total")
      .gte("fecha_venta", fechaDesde)
      .lte("fecha_venta", fechaHasta),
    supabase
      .from("ventas")
      .select("total")
      .gte("fecha_venta", inicioMesAnterior)
      .lte("fecha_venta", finMesAnterior),
    supabase.from("ventas").select("total"),
    supabase.from("pedidos").select("*", { count: "exact", head: true }),
    supabase
      .from("pedidos")
      .select("estado")
      .gte("created_at", fechaDesde + "T00:00:00")
      .lte("created_at", fechaHasta + "T23:59:59"),
    (async () => {
      const { data: ventasIds } = await supabase
        .from("ventas")
        .select("pedido_id")
        .gte("fecha_venta", fechaDesde)
        .lte("fecha_venta", fechaHasta);
      const ids = ventasIds?.map((v) => v.pedido_id) ?? [];
      if (ids.length === 0) return { data: [] };
      return supabase.from("pedido_items").select("nombre, cantidad, subtotal").in("pedido_id", ids);
    })(),
    supabase.from("clientes").select("*", { count: "exact", head: true }),
    supabase
      .from("ventas")
      .select("fecha_venta, total")
      .gte("fecha_venta", fechaDesde)
      .lte("fecha_venta", fechaHasta)
      .order("fecha_venta", { ascending: true }),
    (async () => {
      const { data: ventasData } = await supabase
        .from("ventas")
        .select("pedido_id, total")
        .gte("fecha_venta", fechaDesde)
        .lte("fecha_venta", fechaHasta);
      if (!ventasData?.length) return { data: [] };
      const pedidoIds = ventasData.map((v) => v.pedido_id);
      const { data: pedidos } = await supabase
        .from("pedidos")
        .select("id, nombre_cliente, telefono")
        .in("id", pedidoIds);
      const totalPorPedido = new Map(
        ventasData.map((v) => [v.pedido_id, typeof v.total === "string" ? parseFloat(v.total) : Number(v.total)])
      );
      const porCliente = new Map<string, { nombre: string; telefono: string; pedidos: number; total: number }>();
      (pedidos ?? []).forEach((p) => {
        const total = totalPorPedido.get(p.id) ?? 0;
        const key = p.telefono;
        if (!porCliente.has(key)) {
          porCliente.set(key, { nombre: p.nombre_cliente, telefono: p.telefono, pedidos: 0, total: 0 });
        }
        const c = porCliente.get(key)!;
        c.pedidos++;
        c.total += total;
      });
      return {
        data: Array.from(porCliente.values())
          .sort((a, b) => b.total - a.total)
          .slice(0, 15),
      };
    })(),
    // Ventas y comisiones por vendedor
    (async () => {
      const { data: ventasV } = await supabase
        .from("ventas")
        .select("pedido_id, total")
        .gte("fecha_venta", fechaDesde)
        .lte("fecha_venta", fechaHasta);
      if (!ventasV?.length) return { data: [] };
      const pedidoIdsV = ventasV.map((v) => v.pedido_id);
      const { data: pedidosV } = await supabase
        .from("pedidos")
        .select("id, vendedor_id")
        .in("id", pedidoIdsV);
      const { data: vendedores } = await supabase
        .from("vendedores")
        .select("id, nombre, email, porcentaje_comision");
      const totalPorPedidoV = new Map(
        ventasV.map((v) => [v.pedido_id, typeof v.total === "string" ? parseFloat(v.total) : Number(v.total)])
      );
      const vendedorMap = new Map((vendedores ?? []).map((v) => [v.id, v]));
      const porVendedor = new Map<
        string,
        { nombre: string; email: string; porcentaje: number; ventas: number; comision: number; pedidos: number }
      >();
      const ventaDirecta = { ventas: 0, pedidos: 0 };
      (pedidosV ?? []).forEach((p) => {
        const total = totalPorPedidoV.get(p.id) ?? 0;
        if (!p.vendedor_id) {
          ventaDirecta.ventas += total;
          ventaDirecta.pedidos += 1;
          return;
        }
        const v = vendedorMap.get(p.vendedor_id);
        if (!porVendedor.has(p.vendedor_id)) {
          porVendedor.set(p.vendedor_id, {
            nombre: v?.nombre ?? "Vendedor",
            email: v?.email ?? "",
            porcentaje: v?.porcentaje_comision ?? 0,
            ventas: 0,
            comision: 0,
            pedidos: 0,
          });
        }
        const r = porVendedor.get(p.vendedor_id)!;
        r.ventas += total;
        r.pedidos += 1;
        r.comision += total * ((v?.porcentaje_comision ?? 0) / 100);
      });
      return {
        data: [
          ...Array.from(porVendedor.entries()).map(([id, r]) => ({ vendedor_id: id, ...r })),
          ...(ventaDirecta.ventas > 0
            ? [{ vendedor_id: null, nombre: "Venta directa (sin vendedor)", email: "", porcentaje: 0, ventas: ventaDirecta.ventas, comision: 0, pedidos: ventaDirecta.pedidos }]
            : []),
        ],
      };
    })(),
  ]);

  const sumar = (arr: { total: number | string }[] | null) =>
    arr?.reduce(
      (acc, v) => acc + (typeof v.total === "string" ? parseFloat(v.total) : Number(v.total)),
      0
    ) ?? 0;

  const ventasHoyTotal = sumar(ventasHoy ?? []);
  const ventasRangoTotal = sumar(ventasRango ?? []);
  const ventasMesAnteriorTotal = sumar(ventasMesAnterior ?? []);
  const totalVentasTotal = sumar(totalVentas ?? []);

  const variacionMes =
    ventasMesAnteriorTotal > 0
      ? ((ventasRangoTotal - ventasMesAnteriorTotal) / ventasMesAnteriorTotal) * 100
      : ventasRangoTotal > 0
        ? 100
        : 0;

  const conteoPorEstado: Record<string, number> = {};
  ESTADOS.forEach((e) => (conteoPorEstado[e] = 0));
  (pedidosPorEstado ?? []).forEach((p) => {
    if (p.estado && conteoPorEstado[p.estado] !== undefined) {
      conteoPorEstado[p.estado]++;
    }
  });

  const agregarProductos = (
    items: { nombre: string; cantidad: number; subtotal: number | string }[] | null
  ) => {
    const map: Record<string, { cantidad: number; subtotal: number }> = {};
    (items ?? []).forEach((i) => {
      const key = i.nombre;
      if (!map[key]) map[key] = { cantidad: 0, subtotal: 0 };
      map[key].cantidad += typeof i.cantidad === "string" ? parseInt(i.cantidad, 10) : i.cantidad;
      map[key].subtotal += typeof i.subtotal === "string" ? parseFloat(i.subtotal) : Number(i.subtotal);
    });
    return Object.entries(map)
      .map(([nombre, data]) => ({ nombre, ...data }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);
  };

  const topProductos = agregarProductos(
    productosMasVendidos as { nombre: string; cantidad: number; subtotal: number | string }[] | null
  );

  const porDia: Record<string, number> = {};
  (ventasPorDiaData ?? []).forEach((v) => {
    const f = v.fecha_venta;
    if (!porDia[f]) porDia[f] = 0;
    porDia[f] += typeof v.total === "string" ? parseFloat(v.total) : Number(v.total);
  });
  const ventasPorDia = Object.entries(porDia)
    .map(([fecha, total]) => ({ fecha, total }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const topClientes = (topClientesData ?? []) as { nombre: string; telefono: string; pedidos: number; total: number }[];
  const clientesRecurrentes = topClientes.filter((c) => c.pedidos > 1);

  type VendedorVentas = {
    vendedor_id: string | null;
    nombre: string;
    email: string;
    porcentaje: number;
    ventas: number;
    comision: number;
    pedidos: number;
  };
  const ventasPorVendedor = (ventasPorVendedorData ?? []) as VendedorVentas[];
  const totalComisiones = ventasPorVendedor.reduce((s, v) => s + v.comision, 0);

  const kpis = [
    { label: "Ventas hoy", value: `$${ventasHoyTotal.toLocaleString("es-CO")}`, icon: "TrendingUp", color: "bg-[#f4e8ff]" },
    {
      label: "Ventas en período",
      value: `$${ventasRangoTotal.toLocaleString("es-CO")}`,
      sub: ventasMesAnteriorTotal > 0 ? `${variacionMes >= 0 ? "+" : ""}${variacionMes.toFixed(1)}% vs mes anterior` : null,
      icon: "BarChart3",
      color: "bg-[#e8f9dd]",
    },
    { label: "Total pedidos", value: String(pedidosCount ?? 0), icon: "ShoppingBag", color: "bg-[#e4f3ff]" },
    { label: "Clientes", value: String(clientesCount ?? 0), icon: "UserCircle", color: "bg-[#fff0dc]" },
    { label: "Ventas acumuladas", value: `$${totalVentasTotal.toLocaleString("es-CO")}`, icon: "Package", color: "bg-[#fef3e8]" },
  ];

  const labelsEstado: Record<string, string> = {
    pendiente: "Pendiente",
    confirmado: "Confirmado",
    enviado: "Enviado",
    despachado: "Despachado",
    entregado: "Entregado",
    cancelado: "Cancelado",
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-[var(--ca-purple)]">Informes</h1>
      <p className="mt-1 text-slate-600">
        Resumen de ventas, pedidos y productos más vendidos
      </p>

      <InformesClient
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        kpis={kpis}
        pedidosPorEstado={conteoPorEstado}
        labelsEstado={labelsEstado}
        topProductos={topProductos}
        ventasPorDia={ventasPorDia}
        topClientes={topClientes}
        clientesRecurrentes={clientesRecurrentes}
        ventasPorVendedor={ventasPorVendedor}
        totalComisiones={totalComisiones}
        ventasRangoTotal={ventasRangoTotal}
        ventasMesAnteriorTotal={ventasMesAnteriorTotal}
        variacionPorcentaje={variacionMes}
      />
    </div>
  );
}
