"use client";
import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createMedia, updateMedia, type FormState } from "./actions";

type Values = { id?: string; user_id?: string; prompt?: string; topic?: string; content?: string; provider?: string };

export function MediaForm({ mode, values = {} }: { mode: "create" | "edit"; values?: Values }) {
  const [state, action, pending] = useActionState(mode === "create" ? createMedia : updateMedia, { error: "" } as FormState);
  return <form action={action} className="media-form">
    {values.id && <input type="hidden" name="id" value={values.id}/>}
    <div className="form-grid"><label className="field"><span>OWNER PROFILE ID <b>*</b></span><input name="user_id" required defaultValue={values.user_id} placeholder="Paste a UUID from People" readOnly={mode === "edit"}/><small>Find profile IDs in the People section.</small></label><label className="field"><span>TOPIC <b>*</b></span><select name="topic" defaultValue={values.topic || "Campus"}><option>Campus</option><option>Dorm life</option><option>NYC</option></select></label></div>
    <label className="field"><span>GENERATION PROMPT <b>*</b></span><textarea name="prompt" required minLength={10} maxLength={2000} rows={4} defaultValue={values.prompt} placeholder="What did you ask the AI to create?"/><small>10–2,000 characters</small></label>
    <label className="field"><span>AI GENERATED CAPTION <b>*</b></span><textarea name="content" required maxLength={500} rows={5} defaultValue={values.content} placeholder="Write the final caption…"/><small>Up to 500 characters</small></label>
    <label className="field"><span>AI PROVIDER / MODEL <b>*</b></span><input name="provider" required maxLength={80} defaultValue={values.provider} placeholder="e.g. Gemini 2.5 Flash"/></label>
    {state.error && <div className="alert" role="alert">{state.error}</div>}
    <div className="form-footer"><span>Changes are recorded in the live database.</span><button className="solid-button" type="submit" disabled={pending}>{pending ? <LoaderCircle size={17} className="spin"/> : <ArrowRight size={17}/>} {mode === "create" ? "Publish media" : "Save changes"}</button></div>
  </form>;
}

