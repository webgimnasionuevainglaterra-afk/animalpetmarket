"use client";

import { useCart } from "@/context/CartContext";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Tienda", href: "/tienda" },
  { label: "Ofertas", href: "/ofertas" },
  { label: "Contacto", href: "/" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const totalItems = useCart().getTotalItems();

  return (
    <header className="mt-3 rounded-[24px] border border-white/80 bg-white p-3 shadow-[0_14px_35px_rgba(15,45,77,0.09)]">
      <div className="flex items-center justify-between gap-3 lg:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition hover:bg-slate-200 lg:hidden"
            aria-label="Abrir menú"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex justify-center lg:justify-start">
            <img
              src="/img/logo.jpg"
              alt="Pet Market Animal"
              className="h-[70px] w-auto object-contain sm:h-[90px] lg:h-[105px]"
            />
          </div>
        </div>

        <div className="hidden flex-col items-center gap-3 lg:flex lg:flex-row lg:items-center lg:gap-8">
          <nav className="flex flex-wrap items-center justify-center gap-x-9 gap-y-3 text-base font-semibold text-slate-700">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="hover:text-[var(--ca-purple)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-center gap-2">
            <div className="relative w-[280px] sm:w-[340px]">
              <input
                type="text"
                placeholder="Search"
                className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-[var(--ca-orange)]"
              />
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            </div>
            <Link
              href="/carrito"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#fff6e7] text-[var(--ca-orange)] transition hover:brightness-95"
            >
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ca-orange)] text-[10px] font-black text-white">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-[var(--ca-purple)] px-5 py-2 text-sm font-bold text-white transition hover:brightness-110"
            >
              Ingresar
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/carrito"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#fff6e7] text-[var(--ca-orange)]"
          >
            <ShoppingCart size={18} />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ca-orange)] text-[10px] font-black text-white">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-[var(--ca-purple)] px-4 py-2 text-sm font-bold text-white"
          >
            Ingresar
          </Link>
        </div>
      </div>

      {menuOpen && (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 lg:hidden">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-4 py-3 text-left text-base font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar productos..."
                className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-[var(--ca-orange)]"
              />
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
