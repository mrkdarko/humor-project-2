"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export type ProfileState = { error?: string; success?: string };

export async function saveProfile(_previous: ProfileState, form: FormData): Promise<ProfileState> {
  const { supabase, user } = await requireAdmin();
  const firstname = String(form.get("firstname") || "").trim();
  const lastname = String(form.get("lastname") || "").trim();
  const avatarUrl = String(form.get("avatar_url") || "").trim();
  if (!firstname || firstname.length > 100 || !lastname || lastname.length > 100) return { error: "Enter a first and last name of at most 100 characters each." };
  if (avatarUrl && !avatarUrl.startsWith(`${user.id}/`) && !/^https:\/\//.test(avatarUrl)) return { error: "Invalid avatar path." };
  const { data, error } = await supabase.from("profiles")
    .update({ firstname, lastname, avatar_url: avatarUrl || null })
    .eq("id", user.id).select("id").maybeSingle();
  if (error || !data) return { error: "Could not save your profile. Please try again." };
  revalidatePath("/admin");
  revalidatePath("/admin/profile");
  return { success: "Your player profile was updated." };
}
