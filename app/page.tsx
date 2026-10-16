import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GoogleButton } from "./google-button";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.provider === "google") {
    const { data } = await supabase.from("profiles").select("is_superadmin").eq("id", user.id).maybeSingle();
    if (data?.is_superadmin) redirect("/admin");
  }
  return <main className="login-shell">
    <div className="cloud cloud-1" aria-hidden="true" style={{ top: "15%" }} />
    <div className="cloud cloud-2" aria-hidden="true" style={{ top: "45%" }} />
    <div className="cloud cloud-1" aria-hidden="true" style={{ top: "75%", animationDelay: "-15s" }} />
    <div className="login-main">
      <div className="login-mascots animate-bounce-custom" aria-hidden="true">🍄 ⭐ 🍄</div>
      <h1>HUMOR<br/>PROJECT</h1>
      <p className="login-tagline">ADMIN CONTROL ROOM</p>
      <div className="login-card"><h2>PRESS START</h2><p>Sign in with your authorized Google account to manage players, AI media, and votes.</p><GoogleButton /><div className="login-lock">🔒 SUPERADMIN ACCESS REQUIRED</div></div>
    </div>
    <div className="ground-strip" aria-hidden="true" />
  </main>;
}

