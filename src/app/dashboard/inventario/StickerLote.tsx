"use client";

import { Printer } from "lucide-react";

type LoteSticker = {
  id: string;
  lote: string;
  cantidad: number;
  fecha_vencimiento: string;
  created_at?: string;
  producto_presentaciones: {
    nombre: string;
    productos: { nombre: string } | null;
  } | null;
};

export function StickerLote({ lote }: { lote: LoteSticker }) {
  const productoNombre = lote.producto_presentaciones?.productos?.nombre ?? "Producto";
  const presentacionNombre = lote.producto_presentaciones?.nombre ?? "";
  const fechaIngreso = lote.created_at
    ? new Date(lote.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "-";
  const fechaVenc = new Date(lote.fecha_vencimiento).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  function handlePrint() {
    const ventana = window.open("", "_blank");
    if (!ventana) return;
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sticker - ${lote.lote}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 10px; }
            .sticker {
              width: 70mm;
              height: 40mm;
              border: 2px solid #333;
              padding: 6px;
              font-size: 11px;
            }
            .sticker h2 { font-size: 14px; margin-bottom: 4px; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
            .sticker .codigo { font-family: monospace; font-size: 12px; font-weight: bold; margin: 4px 0; }
            .sticker .row { display: flex; justify-content: space-between; margin: 2px 0; }
            .sticker .label { color: #666; }
          </style>
        </head>
        <body>
          <div class="sticker">
            <h2>${productoNombre} ${presentacionNombre ? "– " + presentacionNombre : ""}</h2>
            <div class="codigo">${lote.lote}</div>
            <div class="row"><span class="label">Ingreso:</span><span>${fechaIngreso}</span></div>
            <div class="row"><span class="label">Cantidad:</span><span>${lote.cantidad} und</span></div>
            <div class="row"><span class="label">Vence:</span><span>${fechaVenc}</span></div>
          </div>
        </body>
      </html>
    `);
    ventana.document.close();
    ventana.focus();
    ventana.print();
    ventana.close();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
      title="Imprimir sticker"
    >
      <Printer size={12} />
      Sticker
    </button>
  );
}
