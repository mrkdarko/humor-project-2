import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ProfileForm } from "./profile-form";

function metadataText(metadata: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export default async function MyProfilePage() {
  const { supabase, user, profile } = await requireAdmin();
  const { data } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();
  const metadata = (user.user_metadata || {}) as Record<string, unknown>;
  const firstName = profile.firstname?.trim() || metadataText(metadata, "given_name", "first_name", "firstname");
  const lastName = profile.lastname?.trim() || metadataText(metadata, "family_name", "last_name", "lastname");
  const savedAvatar = data?.avatar_url || "";
  const avatarPath = savedAvatar && !savedAvatar.startsWith("http") ? savedAvatar : "";
  const providerAvatar = savedAvatar.startsWith("http") ? savedAvatar : metadataText(metadata, "avatar_url", "picture");
  const { data: signedAvatar } = avatarPath ? await supabase.storage.from("avatars").createSignedUrl(avatarPath, 3600) : { data: null };
  return <>
    <div className="page-heading"><div><div className="eyebrow dark">PLAYER SETTINGS</div><h1>Character select <span className="heading-spark">★</span></h1><p>Update your regular player profile.</p></div><Link href="/admin/play" className="solid-button">BACK TO PLAY</Link></div>
    <section className="panel form-panel play-profile"><div className="form-panel-heading"><span className="step-number">1P</span><div><h2>YOUR PLAYER CARD</h2><p>The same profile appears on the regular Humor Project site.</p></div></div><ProfileForm userId={user.id} firstName={firstName} lastName={lastName} initialAvatarPath={savedAvatar} initialAvatarPreview={signedAvatar?.signedUrl || providerAvatar}/></section>
  </>;
}
