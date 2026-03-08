export const IVA_POR_DEFECTO = 19;
export const IVA_OPCIONES = [0, 5, 19] as const;

export type IvaPorcentaje = (typeof IVA_OPCIONES)[number];

function esIvaValido(valor: number | null | undefined): valor is IvaPorcentaje {
  return valor === 0 || valor === 5 || valor === 19;
}

export function resolverIvaPorcentaje({
  ivaPorcentaje,
  aplicaIva,
  fallbackPorcentaje,
  fallbackAplicaIva,
}: {
  ivaPorcentaje?: number | null;
  aplicaIva?: boolean | null;
  fallbackPorcentaje?: number | null;
  fallbackAplicaIva?: boolean | null;
}): IvaPorcentaje {
  if (esIvaValido(ivaPorcentaje)) return ivaPorcentaje;
  if (typeof aplicaIva === "boolean") return aplicaIva ? IVA_POR_DEFECTO : 0;
  if (esIvaValido(fallbackPorcentaje)) return fallbackPorcentaje;
  if (typeof fallbackAplicaIva === "boolean") return fallbackAplicaIva ? IVA_POR_DEFECTO : 0;
  return IVA_POR_DEFECTO;
}

export function aplicarIva(precioBase: number, ivaPorcentaje: number | null | undefined): number {
  const porcentaje = esIvaValido(ivaPorcentaje) ? ivaPorcentaje : IVA_POR_DEFECTO;
  return precioBase * (1 + porcentaje / 100);
}

export function tieneIva(ivaPorcentaje: number | null | undefined): boolean {
  return (esIvaValido(ivaPorcentaje) ? ivaPorcentaje : 0) > 0;
}

export function etiquetaIva(ivaPorcentaje: number | null | undefined): string {
  const porcentaje = esIvaValido(ivaPorcentaje) ? ivaPorcentaje : 0;
  return porcentaje > 0 ? `IVA ${porcentaje}% incl.` : "Sin IVA";
}
