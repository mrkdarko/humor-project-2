"use client";

import { useActionState, useState } from "react";
import { submitPost } from "./actions";

export function Composer() {
  const [mode, setMode] = useState<"draft" | "publish">("publish");
  const [state, action, pending] = useActionState(submitPost, {});
  return <form action={action} className="media-form">
    <div className="play-mode" role="group" aria-label="Submission type">
      <button type="button" aria-pressed={mode === "draft"} onClick={() => setMode("draft")} className={mode === "draft" ? "selected" : ""}>💾 SAVE DRAFT</button>
      <button type="button" aria-pressed={mode === "publish"} onClick={() => setMode("publish")} className={mode === "publish" ? "selected" : ""}>⚡ ASK AI & PUBLISH</button>
    </div>
    <input type="hidden" name="mode" value={mode}/>
    <label className="field"><span>TOPIC</span><select name="topic"><option>Campus</option><option>Dorm life</option><option>NYC</option></select></label>
    <label className="field"><span>PROMPT</span><textarea name="prompt" required minLength={10} maxLength={2000} rows={4} placeholder="What should your caption be about?"/></label>
    {mode === "publish" && <label className="play-consent"><input type="checkbox" name="consent" value="yes" required/> I agree to share my prompt and AI generated caption with the community.</label>}
    {state.error && <div className="alert" role="alert">{state.error}</div>}
    {state.success && <div className="success-note" role="status">{state.success}</div>}
    <button className="solid-button" type="submit" disabled={pending}>{pending ? "WORKING..." : mode === "draft" ? "SAVE DRAFT" : "GENERATE & PUBLISH"}</button>
  </form>;
}
