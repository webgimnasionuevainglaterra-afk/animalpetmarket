"use client";

import { suscribirNewsletter } from "@/app/newsletter/actions";
import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    const res = await suscribirNewsletter(email);
    if ("success" in res && res.success) {
      setStatus("success");
      setMessage("¡Gracias! Te has suscrito correctamente.");
      setEmail("");
    } else if ("error" in res && res.error) {
      setStatus("error");
      setMessage(res.error);
    }
  }

  return (
    <div className="rounded-2xl bg-white/14 p-4 backdrop-blur">
      <h4 className="text-lg font-black">Suscríbete</h4>
      <p className="mt-1 text-sm text-white/90">
        Recibe promociones y consejos para tu mascota.
      </p>
      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2 rounded-full bg-white p-1.5">
        <input
          type="email"
          name="email"
          placeholder="Ingresa tu correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
          className="w-full bg-transparent px-3 text-sm text-slate-700 outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-full bg-[var(--ca-orange)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {status === "loading" ? "..." : "Suscribirme"}
        </button>
      </form>
      {message && (
        <p className={`mt-2 text-sm ${status === "success" ? "text-green-200" : "text-red-200"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
