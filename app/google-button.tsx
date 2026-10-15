"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signIn() {
    setBusy(true); setError("");
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { prompt: "select_account" } },
    });
    if (error) { setError(error.message); setBusy(false); }
  }
  return <><button className="google-button" type="button" disabled={busy} onClick={signIn}><span className="google-g">G</span>{busy ? "CONNECTING..." : "CONTINUE WITH GOOGLE"}</button>{error && <p role="alert" className="form-error">{error}</p>}</>;
}

