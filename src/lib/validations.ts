/** Regex para UUID v4 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(uuid: string): boolean {
  return typeof uuid === "string" && UUID_REGEX.test(uuid.trim());
}

export function validarLongitud(
  valor: string,
  max: number,
  min = 1
): string | null {
  const s = (valor ?? "").trim();
  if (min > 0 && s.length < min) return `Debe tener al menos ${min} caracteres`;
  if (s.length > max) return `Máximo ${max} caracteres`;
  return null;
}

export function validarTelefono(tel: string): string | null {
  const s = (tel?.trim() ?? "").replace(/\s/g, "");
  const soloDigitos = s.replace(/^\+/, "").replace(/\D/g, "");
  if (soloDigitos.length < 7) return "Teléfono inválido (mínimo 7 dígitos)";
  if (soloDigitos.length > 15) return "Teléfono inválido (máximo 15 dígitos)";
  return null;
}

export function validarNumero(
  valor: number,
  min: number,
  max: number,
  campo = "Valor"
): string | null {
  if (isNaN(valor) || valor < min) return `${campo} debe ser al menos ${min}`;
  if (valor > max) return `${campo} no puede ser mayor a ${max}`;
  return null;
}

export function validarFecha(fecha: string): string | null {
  if (!fecha?.trim()) return null;
  const match = fecha.trim().match(/^\d{4}-\d{2}-\d{2}$/);
  if (!match) return "Formato inválido (use YYYY-MM-DD)";
  const d = new Date(fecha + "T12:00:00");
  if (isNaN(d.getTime())) return "Fecha inválida";
  return null;
}

export function sanitizarTexto(texto: string, maxLen: number): string {
  return (texto ?? "").trim().slice(0, maxLen);
}
