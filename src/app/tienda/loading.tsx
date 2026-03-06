export default function TiendaLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--ca-purple)] border-t-transparent" />
        <p className="text-sm font-medium text-slate-600">Cargando tienda...</p>
      </div>
    </div>
  );
}
