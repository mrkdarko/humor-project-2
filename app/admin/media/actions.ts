"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export type FormState = { error: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const topics = ["Campus", "Dorm life", "NYC"];

function parse(form: FormData) {
  const userId = String(form.get("user_id") || "").trim();
  const prompt = String(form.get("prompt") || "").trim();
  const topic = String(form.get("topic") || "").trim();
  const content = String(form.get("content") || "").trim();
  const provider = String(form.get("provider") || "").trim();
  if (!uuid.test(userId)) return { error: "Choose a valid profile ID for the media owner." } as const;
  if (prompt.length < 10 || prompt.length > 2000) return { error: "Prompt must be 10–2,000 characters." } as const;
  if (!topics.includes(topic)) return { error: "Choose a valid topic." } as const;
  if (!content || content.length > 500) return { error: "Caption must be 1–500 characters." } as const;
  if (!provider || provider.length > 80) return { error: "Provider must be 1–80 characters." } as const;
  return { userId, prompt, topic, content, provider };
}

export async function createMedia(_state: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const values = parse(form);
  if ("error" in values) return { error: values.error ?? "Invalid media." };
  const { error } = await supabase.rpc("admin_create_media", {
    p_user_id: values.userId, p_prompt: values.prompt, p_topic: values.topic,
    p_content: values.content, p_provider: values.provider,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin"); revalidatePath("/admin/media");
  redirect("/admin/media?created=1");
}

export async function updateMedia(_state: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = String(form.get("id") || "");
  if (!uuid.test(id)) return { error: "Invalid media ID." };
  const values = parse(form);
  if ("error" in values) return { error: values.error ?? "Invalid media." };
  const { error } = await supabase.rpc("admin_update_media", {
    p_caption_id: id, p_prompt: values.prompt, p_topic: values.topic,
    p_content: values.content, p_provider: values.provider,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin"); revalidatePath("/admin/media"); revalidatePath(`/admin/media/${id}`);
  redirect(`/admin/media/${id}?saved=1`);
}

export async function deleteMedia(form: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(form.get("id") || "");
  if (!uuid.test(id)) throw new Error("Invalid media ID.");
  const { error } = await supabase.rpc("admin_delete_media", { p_caption_id: id });
  if (error) throw new Error(error.message);
  revalidatePath("/admin"); revalidatePath("/admin/media"); revalidatePath("/admin/ratings");
  redirect("/admin/media?deleted=1");
}

