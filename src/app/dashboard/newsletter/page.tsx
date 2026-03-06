import { createAdminClient } from "@/lib/supabase/server";
import { NewsletterClient } from "./NewsletterClient";

export default async function NewsletterPage() {
  const supabase = createAdminClient();

  const { data: suscriptores } = await supabase
    .from("suscriptores")
    .select("id, email, created_at")
    .order("created_at", { ascending: false });

  return (
    <NewsletterClient suscriptores={suscriptores ?? []} />
  );
}
