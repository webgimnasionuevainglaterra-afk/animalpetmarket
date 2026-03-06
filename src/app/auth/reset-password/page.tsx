"use client";

import { createClient } from "@/lib/supabase/client";
import { KeyRound, PawPrint } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
              <KeyRound size={28} />
              Nueva contraseña
            </h1>
            <p className="mt-1 text-sm text-white/90">
              Ingresa tu nueva contraseña
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {error && (
              <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-bold text-slate-700"
                >
                  Nueva contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-800 outline-none transition focus:border-[var(--ca-purple)] focus:ring-2 focus:ring-[var(--ca-purple)]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmar"
                  className="mb-1.5 block text-sm font-bold text-slate-700"
                >
                  Confirmar contraseña
                </label>
                <input
                  id="confirmar"
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="Repite la contraseña"
                  required
                  minLength={6}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-800 outline-none transition focus:border-[var(--ca-purple)] focus:ring-2 focus:ring-[var(--ca-purple)]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ca-purple)] to-[#8e24aa] font-bold text-white shadow-lg shadow-purple-300/40 transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? (
                <span className="animate-pulse">Guardando…</span>
              ) : (
                <>
                  <PawPrint size={20} />
                  Guardar contraseña
                </>
              )}
            </button>

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
