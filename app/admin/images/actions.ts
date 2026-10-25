"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function saveImage(form: FormData): Promise<{ error?: string; id?: string }> {
  const { supabase, user } = await requireAdmin();
  const id = String(form.get("id") || "");
  const storagePath = String(form.get("storage_path") || "");
  const title = String(form.get("title") || "").trim();
  const altText = String(form.get("alt_text") || "").trim();
  if (id && !uuid.test(id)) return { error: "Invalid image ID." };
  if (!title || title.length > 160 || altText.length > 500) return { error: "Enter a title up to 160 characters and alt text up to 500 characters." };
  if (storagePath && !new RegExp(`^${user.id}/[0-9a-f-]+\\.(jpg|png|webp|gif)$`, "i").test(storagePath)) return { error: "Invalid upload path." };
  if (!id && !storagePath) return { error: "Choose an image to upload." };
  if (storagePath) {
    const { error } = await supabase.storage.from("admin-images").createSignedUrl(storagePath, 60);
    if (error) return { error: "The uploaded image could not be verified." };
  }
  if (id) {
    const { data: old, error: readError } = await supabase.from("images").select("storage_path").eq("id", id).maybeSingle();
    if (readError || !old) return { error: "Image not found." };
    const update = { title, alt_text: altText, ...(storagePath ? { storage_path: storagePath } : {}) };
    const { error } = await supabase.from("images").update(update).eq("id", id).select("id").maybeSingle();
    if (error) return { error: error.message };
    if (storagePath && old.storage_path !== storagePath) await supabase.storage.from("admin-images").remove([old.storage_path]);
    revalidatePath("/admin/images"); revalidatePath(`/admin/images/${id}`);
    return { id };
  }
  const { data, error } = await supabase.from("images").insert({ storage_path: storagePath, title, alt_text: altText, uploaded_by: user.id }).select("id").maybeSingle();
  if (error || !data) {
    await supabase.storage.from("admin-images").remove([storagePath]);
    return { error: error?.message || "The image could not be saved." };
  }
  revalidatePath("/admin/images");
  return { id: data.id };
}

export async function deleteImage(id: string): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();
  if (!uuid.test(id)) return { error: "Invalid image ID." };
  const { data: row, error } = await supabase.from("images").select("storage_path").eq("id", id).maybeSingle();
  if (error || !row) return { error: "Image not found." };
  const removed = await supabase.storage.from("admin-images").remove([row.storage_path]);
  if (removed.error) return { error: removed.error.message };
  const deleted = await supabase.from("images").delete().eq("id", id);
  if (deleted.error) return { error: deleted.error.message };
  revalidatePath("/admin/images");
  return {};
}
