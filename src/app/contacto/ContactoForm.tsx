"use client";

import { enviarContacto } from "./actions";
import { useState } from "react";

export function ContactoForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setStatus("loading");
    setMessage("");
    const res = await enviarContacto(formData);
    if ("success" in res && res.success && "whatsappUrl" in res && res.whatsappUrl) {
      setStatus("success");
      setMessage("Se abrirá WhatsApp con tu mensaje. Envíalo para contactarnos.");
      form.reset();
      window.open(res.whatsappUrl, "_blank", "noopener");
    } else if ("success" in res && res.success) {
      setStatus("success");
      setMessage("Gracias por contactarnos. Te responderemos pronto.");
      form.reset();
    } else if ("error" in res && res.error) {
      setStatus("error");
      setMessage(res.error);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800">Envíanos un mensaje</h2>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-slate-700">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            maxLength={120}
            className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[var(--ca-purple)]"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={254}
            className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[var(--ca-purple)]"
            placeholder="tu@correo.com"
          />
        </div>
        <div>
          <label htmlFor="asunto" className="block text-sm font-medium text-slate-700">
            Asunto
          </label>
          <input
            id="asunto"
            name="asunto"
            type="text"
            required
            maxLength={200}
            className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[var(--ca-purple)]"
            placeholder="¿En qué podemos ayudarte?"
          />
        </div>
        <div>
          <label htmlFor="mensaje" className="block text-sm font-medium text-slate-700">
            Mensaje
          </label>
          <textarea
            id="mensaje"
            name="mensaje"
            required
            rows={4}
            maxLength={1000}
            className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[var(--ca-purple)]"
            placeholder="Escribe tu mensaje..."
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-xl bg-[var(--ca-purple)] px-6 py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {status === "loading" ? "Enviando..." : "Enviar mensaje"}
        </button>
        {message && (
          <p className={`text-sm ${status === "success" ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
