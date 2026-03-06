"use server";

import { getConfiguracion, getWhatsappNum } from "@/lib/config";
import { sanitizarTexto } from "@/lib/validations";

const MAX_NOMBRE = 120;
const MAX_ASUNTO = 200;
const MAX_MENSAJE = 1000;

export async function enviarContacto(formData: FormData) {
  const nombre = (formData.get("nombre") as string) ?? "";
  const email = (formData.get("email") as string) ?? "";
  const asunto = (formData.get("asunto") as string) ?? "";
  const mensaje = (formData.get("mensaje") as string) ?? "";

  if (!nombre.trim()) return { error: "El nombre es obligatorio" };
  if (!email.trim()) return { error: "El correo es obligatorio" };
  if (!asunto.trim()) return { error: "El asunto es obligatorio" };
  if (!mensaje.trim()) return { error: "El mensaje es obligatorio" };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return { error: "Correo electrónico inválido" };

  const n = sanitizarTexto(nombre, MAX_NOMBRE);
  const a = sanitizarTexto(asunto, MAX_ASUNTO);
  const m = sanitizarTexto(mensaje, MAX_MENSAJE);
  const e = email.trim().toLowerCase().slice(0, 254);

  const config = await getConfiguracion();
  const whatsapp = getWhatsappNum(config);
  const texto = `*Nuevo mensaje de contacto*\n\nNombre: ${n}\nEmail: ${e}\nAsunto: ${a}\n\nMensaje:\n${m}`;
  const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(texto)}`;

  return { success: true, whatsappUrl: url };
}
