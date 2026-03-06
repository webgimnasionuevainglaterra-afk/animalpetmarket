"use client";

import { createClient } from "@/lib/supabase/client";
import { Mail, PawPrint } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviado(false);

    if (!email.trim()) {
      setError("Ingresa tu correo electrónico");
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      }
    );
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setEnviado(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#ffeef7,transparent_42%),#fff7ef] px-4">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-[28px] border border-[#f3dcff] bg-white shadow-[0_22px_52px_rgba(123,31,162,0.12)]">
          <div className="bg-gradient-to-r from-[var(--ca-purple)] to-[#8e24aa] px-8 py-6 text-center">
            <Link href="/" className="inline-block">
              <img
                src="/logo-centro-animal.JPG"
                alt="Pet Market Animal"
                className="mx-auto h-16 w-auto rounded-full border-2 border-white object-cover shadow-lg"
              />
            </Link>
            <h1 className="mt-4 flex items-center justify-center gap-2 text-2xl font-black text-white">
              <Mail size={28} />
              Recuperar contraseña
            </h1>
            <p className="mt-1 text-sm text-white/90">
              Te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {error && (
              <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {error}
              </div>
            )}
            {enviado && (
              <div className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                Revisa tu correo. Te enviamos un enlace para restablecer tu contraseña.
              </div>
            )}

            {!enviado && (
              <>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-bold text-slate-700"
                  >
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@petmarket.com"
                    required
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-800 outline-none transition focus:border-[var(--ca-purple)] focus:ring-2 focus:ring-[var(--ca-purple)]/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ca-purple)] to-[#8e24aa] font-bold text-white shadow-lg shadow-purple-300/40 transition hover:brightness-110 disabled:opacity-60"
                >
                  {loading ? (
                    <span className="animate-pulse">Enviando…</span>
                  ) : (
                    <>
                      <PawPrint size={20} />
                      Enviar enlace
                    </>
                  )}
                </button>
              </>
            )}

            <p className="mt-4 text-center text-sm text-slate-500">
              <Link href="/login" className="font-semibold text-[var(--ca-purple)] hover:underline">
                ← Volver al login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
