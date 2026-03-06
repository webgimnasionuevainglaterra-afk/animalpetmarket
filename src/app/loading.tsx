export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#ffeef7,transparent_42%),#fff7ef]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--ca-purple)] border-t-transparent" />
        <p className="text-sm font-medium text-slate-600">Cargando...</p>
      </div>
    </div>
  );
}
