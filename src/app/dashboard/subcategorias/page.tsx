import { createClient } from "@/lib/supabase/server";
import { SubcategoriasClient } from "./SubcategoriasClient";

export default async function SubcategoriasPage() {
  const supabase = await createClient();
  const { data: subcategorias } = await supabase
    .from("subcategorias")
    .select(`
      id,
      nombre,
      categoria_id,
      created_at,
      categorias (nombre)
    `)
    .order("nombre");

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nombre")
    .order("nombre");

  const normalized = (subcategorias ?? []).map((s) => ({
    ...s,
    categorias: Array.isArray(s.categorias) ? s.categorias[0] ?? null : s.categorias,
  }));

  return (
    <SubcategoriasClient
      subcategorias={normalized}
      categorias={categorias ?? []}
    />
  );
}
