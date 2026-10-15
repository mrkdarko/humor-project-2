import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || user.app_metadata?.provider !== "google") redirect("/");

  // Read the database on each request so revocation takes effect without a JWT refresh.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, firstname, lastname, is_superadmin")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || profile?.is_superadmin !== true) redirect("/denied");
  return { supabase, user, profile };
}

