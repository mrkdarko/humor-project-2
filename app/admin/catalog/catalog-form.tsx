"use client";

import { useActionState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import type { Resource } from "@/lib/admin-catalog";
import { saveCatalog, type CatalogState } from "./actions";

type Row = Record<string, unknown>;
export function CatalogForm({ resource, row, providers = [] }: { resource: Resource; row?: Row; providers?: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(saveCatalog, { error: "" } as CatalogState);
  return <form action={action} className="media-form">
    <input type="hidden" name="resource" value={resource.slug}/>
    {row && typeof row.id === "string" && <input type="hidden" name="id" value={row.id}/>}
    {resource.fields.map(field => {
      const value = row?.[field.key];
      if (field.kind === "boolean") return <label className="catalog-check" key={field.key}><input type="checkbox" name={field.key} defaultChecked={row ? value === true : true}/><span>{field.label}</span></label>;
      if (field.key === "provider_id") return <label className="field" key={field.key}><span>{field.label} <b>*</b></span><select name={field.key} defaultValue={String(value || "")} required><option value="">Choose a provider</option>{providers.map(provider => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label>;
      if (field.kind === "textarea") return <label className="field" key={field.key}><span>{field.label} {field.required && <b>*</b>}</span><textarea name={field.key} defaultValue={String(value || "")} required={field.required} maxLength={field.max} rows={5}/></label>;
      return <label className="field" key={field.key}><span>{field.label} {field.required && <b>*</b>}</span><input name={field.key} type={field.kind === "email" ? "email" : field.kind === "number" ? "number" : "text"} step={field.kind === "number" ? "0.01" : undefined} min={field.kind === "number" ? 0 : undefined} max={field.kind === "number" ? 100 : undefined} defaultValue={String(value ?? "")} required={field.required} maxLength={field.max}/></label>;
    })}
    {state.error && <div className="alert" role="alert">{state.error}</div>}
    <div className="form-footer"><span>Changes are saved to the live database.</span><button className="solid-button" disabled={pending} type="submit">{pending ? <LoaderCircle size={17} className="spin"/> : <Save size={17}/>} {row ? "Save changes" : "Create record"}</button></div>
  </form>;
}
