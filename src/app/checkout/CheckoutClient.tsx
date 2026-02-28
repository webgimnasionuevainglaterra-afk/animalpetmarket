"use client";

import { useCart } from "@/context/CartContext";
import { Check, Package } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { crearPedido } from "./actions";

export function CheckoutClient() {
  const router = useRouter();
  const { items, getTotalPrecio, clearCart } = useCart();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = getTotalPrecio();

  if (items.length === 0) {
    return (
      <section className="mt-6">
        <h1 className="text-3xl font-black text-[var(--ca-purple)]">
          Finalizar compra
        </h1>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-lg font-semibold text-slate-600">
            Tu carrito está vacío
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-[var(--ca-purple)] font-bold hover:underline"
          >
            Ir a la tienda
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <Link
        href="/carrito"
        className="mb-4 inline-block text-sm font-semibold text-[var(--ca-purple)] hover:underline"
      >
        ← Volver al carrito
      </Link>

      <h1 className="text-3xl font-black text-[var(--ca-purple)]">
        Finalizar compra
      </h1>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <Package size={20} className="text-amber-600" />
        <p className="text-sm font-medium text-amber-800">
          Pago contra entrega. No realizamos cobros en línea. Pagas cuando recibes tu pedido.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Formulario */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">
            Datos de entrega
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Completa tus datos para el envío (pago contra entrega)
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Nombre completo *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                maxLength={120}
                className="h-11 w-full rounded-xl border border-slate-200 px-4"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Teléfono / WhatsApp *
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="300 123 4567"
                maxLength={15}
                className="h-11 w-full rounded-xl border border-slate-200 px-4"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Dirección de entrega *
              </label>
              <textarea
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Barrancabermeja, dirección completa"
                rows={3}
                maxLength={300}
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Notas del pedido
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Instrucciones especiales..."
                rows={2}
                maxLength={500}
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="h-fit rounded-2xl border border-[#f3dcff] bg-white p-6 shadow-[0_10px_26px_rgba(123,31,162,0.12)]">
          <h2 className="text-lg font-bold text-slate-800">
            Resumen del pedido
          </h2>
          <ul className="mt-4 space-y-2 border-b border-slate-100 pb-4">
            {items.map((i) => (
              <li
                key={`${i.productId}-${i.presentacion}`}
                className="flex justify-between text-sm"
              >
                <span className="text-slate-600">
                  {i.nombre} ({i.presentacion}) x{i.cantidad}
                </span>
                <span className="font-semibold">
                  ${(i.precio * i.cantidad).toLocaleString("es-CO")}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between text-lg font-black">
            <span>Total</span>
            <span className="text-[var(--ca-orange)]">
              ${total.toLocaleString("es-CO")}
            </span>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <div className="mt-6 space-y-3">
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setError(null);
                setLoading(true);
                const result = await crearPedido(
                  nombre,
                  telefono,
                  direccion,
                  notas || null,
                  items.map((i) => ({
                    productId: i.productId,
                    nombre: i.nombre,
                    presentacion: i.presentacion,
                    precio: i.precio,
                    cantidad: i.cantidad,
                  })),
                  total
                );
                setLoading(false);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                clearCart();
                const ordenParam = result.numeroOrden
                  ? `&orden=${encodeURIComponent(result.numeroOrden)}`
                  : "";
                router.push(`/?pedido=ok${ordenParam}`);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ca-purple)] to-[#8e24aa] px-6 py-3.5 font-bold text-white shadow-lg shadow-purple-500/30 transition hover:brightness-110 disabled:opacity-60"
            >
              <Check size={22} /            >
              Finalizar compra
            </button>
            <Link
              href="/"
              className="flex w-full items-center justify-center rounded-xl border-2 border-slate-200 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
