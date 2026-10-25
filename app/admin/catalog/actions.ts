"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getResource } from "@/lib/admin-catalog";

export type CatalogState = { error: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function saveCatalog(_previous: CatalogState, form: FormData): Promise<CatalogState> {
  const { supabase } = await requireAdmin();
  const slug = String(form.get("resource") || "");
  const config = getResource(slug);
  const id = String(form.get("id") || "");
  if (!config || (id ? !config.canEdit || !uuid.test(id) : !config.canCreate)) return { error: "Invalid catalog action." };
  const values: Record<string, string | number | boolean | null> = {};
  for (const field of config.fields) {
    if (field.kind === "boolean") { values[field.key] = form.get(field.key) === "on"; continue; }
    const value = String(form.get(field.key) || "").trim();
    if (field.required && !value) return { error: `${field.label} is required.` };
    if (field.max && value.length > field.max) return { error: `${field.label} must be at most ${field.max} characters.` };
    if (field.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { error: "Enter a valid email address." };
    if (field.kind === "domain" && !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value.toLowerCase())) return { error: "Enter a valid domain, such as example.com." };
    if (field.kind === "uuid" && !uuid.test(value)) return { error: `Select a valid ${field.label.toLowerCase()}.` };
    if (field.kind === "number") {
      const number = Number(value);
      if (!Number.isFinite(number) || number < 0 || number > 100) return { error: `${field.label} must be between 0 and 100.` };
      values[field.key] = number;
    } else values[field.key] = field.kind === "email" || field.kind === "domain" ? value.toLowerCase() : (value || null);
  }
  if (slug === "prompt-mix") values.updated_at = new Date().toISOString();
  const result = id
    ? await supabase.from(config.table).update(values).eq("id", id).select("id").maybeSingle()
    : await supabase.from(config.table).insert(values).select("id").maybeSingle();
  if (result.error || !result.data) return { error: result.error?.message || "The record could not be saved." };
  revalidatePath(`/admin/catalog/${slug}`);
  redirect(`/admin/catalog/${slug}?saved=1`);
}

export async function deleteCatalog(_previous: CatalogState, form: FormData): Promise<CatalogState> {
  const { supabase } = await requireAdmin();
  const slug = String(form.get("resource") || "");
  const id = String(form.get("id") || "");
  const config = getResource(slug);
  if (!config?.canDelete || !uuid.test(id)) return { error: "Invalid catalog action." };
  const { data, error } = await supabase.from(config.table).delete().eq("id", id).select("id").maybeSingle();
  if (error || !data) return { error: error?.message || "Record not found." };
  revalidatePath(`/admin/catalog/${slug}`);
  redirect(`/admin/catalog/${slug}?deleted=1`);
}
