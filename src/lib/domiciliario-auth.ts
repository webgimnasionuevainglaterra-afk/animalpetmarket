export const DOMICILIARIO_EMAIL_SUFFIX = "@domicilio.internal";

export function placaToEmail(placa: string): string {
  return placa.trim().toUpperCase().replace(/\s/g, "") + DOMICILIARIO_EMAIL_SUFFIX;
}
