"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export type PlayState = { error?: string; success?: string };
const topics = ["Campus", "Dorm life", "NYC"];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function submitPost(_previous: PlayState, form: FormData): Promise<PlayState> {
  const { supabase, user } = await requireAdmin();
  const prompt = String(form.get("prompt") || "").trim();
  const topic = String(form.get("topic") || "");
  const mode = String(form.get("mode") || "");
  if (prompt.length < 10 || prompt.length > 2000) return { error: "Prompt must be 10–2,000 characters." };
  if (!topics.includes(topic)) return { error: "Choose a topic." };
  if (mode !== "draft" && mode !== "publish") return { error: "Choose a submission type." };

  if (mode === "draft") {
    const { error } = await supabase.from("generations").insert({
      user_id: user.id, prompt, topic, source: "pending", status: "queued",
    });
    if (error) return { error: "Could not save your draft. Please try again." };
    revalidatePath("/admin/play");
    return { success: "Your private draft was saved." };
  }

  if (form.get("consent") !== "yes") return { error: "Confirm that you agree to share the generated caption." };
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { error: "AI publishing is not configured. Add GEMINI_API_KEY to this Vercel project." };

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: "You are a funny, chronically online college student living in NYC. Write a caption based on the user's prompt. Keep it under 200 characters. Do not use quotes." }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8 },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      console.error("Gemini request failed:", response.status);
      return { error: "AI generation is unavailable. Try again later." };
    }
    const data = await response.json() as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
    const content = data.candidates?.[0]?.content?.parts?.filter(part => !part.thought).map(part => part.text || "").join("").trim().slice(0, 500);
    if (!content) return { error: "AI did not return a caption. Try another prompt." };
    const { error } = await supabase.rpc("publish_external_caption", {
      p_prompt: prompt, p_topic: topic, p_content: content, p_provider: "Gemini 3.5 Lite",
    });
    if (error) return { error: "Could not publish your caption. Please try again." };
    revalidatePath("/admin/play");
    revalidatePath("/admin");
    return { success: "Your AI caption was published." };
  } catch (error) {
    console.error("AI generation failed:", error);
    return { error: "AI generation is unavailable. Try again later." };
  }
}

export async function voteCaption(_previous: PlayState, form: FormData): Promise<PlayState> {
  const { supabase } = await requireAdmin();
  const captionId = String(form.get("caption_id") || "");
  const value = String(form.get("value") || "");
  if (!uuid.test(captionId) || !["1", "-1", "0"].includes(value)) return { error: "Invalid vote." };
  const { error } = await supabase.rpc("submit_caption_vote", {
    p_caption_id: captionId, p_value: Number(value),
  });
  if (error) return { error: "Could not save your vote. You cannot rate your own caption." };
  revalidatePath("/admin/play");
  revalidatePath("/admin");
  revalidatePath("/admin/ratings");
  return { success: value === "0" ? "Vote removed." : "Vote saved." };
}
