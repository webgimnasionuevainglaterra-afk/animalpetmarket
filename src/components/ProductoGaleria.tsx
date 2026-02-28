"use client";

import { useEffect, useState } from "react";

type Imagen = { url: string; label?: string };

export function ProductoGaleria({
  imagenes,
  nombre,
  badge,
  imagenInicial,
  onImagenChange,
}: {
  imagenes: Imagen[];
  nombre: string;
  badge?: string | null;
  imagenInicial?: number;
  onImagenChange?: (index: number) => void;
}) {
  const [activa, setActiva] = useState(imagenInicial ?? 0);

  useEffect(() => {
    if (imagenInicial != null) setActiva(imagenInicial);
  }, [imagenInicial]);

  const handleSelect = (i: number) => {
    setActiva(i);
    onImagenChange?.(i);
  };

  const img = imagenes[activa] ?? imagenes[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-b from-[#fff8e8] to-[#ffeef6]">
        <img
          src={img?.url}
          alt={img?.label ?? nombre}
          className="h-full w-full object-cover"
        />
        {badge && (
          <span className="absolute left-3 top-3 rounded-full bg-[#63c132] px-3 py-1 text-xs font-black text-white">
            {badge}
          </span>
        )}
      </div>
      {imagenes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {imagenes.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                activa === i
                  ? "border-[var(--ca-purple)] ring-2 ring-[var(--ca-purple)]/30"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <img
                src={img.url}
                alt={img.label ?? `Imagen ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
