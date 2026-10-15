"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveProfile } from "./actions";

export function ProfileForm({ userId, firstName, lastName, initialAvatarPath, initialAvatarPreview }: {
  userId: string; firstName: string; lastName: string; initialAvatarPath: string; initialAvatarPreview: string;
}) {
  const [avatarPath, setAvatarPath] = useState(initialAvatarPath);
  const [avatarPreview, setAvatarPreview] = useState(initialAvatarPreview);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [state, action, pending] = useActionState(saveProfile, {});

  async function uploadPhoto(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setUploadError("Choose a JPG, PNG, WebP, or GIF under 5 MB.");
      return;
    }
    setUploading(true);
    setUploadError("");
    const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" } as Record<string, string>)[file.type];
    const path = `${userId}/${crypto.randomUUID()}.${extension}`;
    const supabase = createClient();
    const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: false });
    if (error) setUploadError(error.message);
    else {
      const { data, error: previewError } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
      if (previewError) setUploadError(previewError.message);
      else { setAvatarPath(path); setAvatarPreview(data.signedUrl); }
    }
    setUploading(false);
  }

  return <form action={action} className="media-form">
    <div className="play-avatar-row"><div className="play-avatar">{avatarPreview ? <Image src={avatarPreview} alt="Your avatar" fill sizes="96px" unoptimized/> : <span>{firstName.charAt(0).toUpperCase() || "?"}</span>}</div><label className="solid-button play-upload">CHANGE AVATAR<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading || pending} onChange={event => void uploadPhoto(event.target.files?.[0])}/></label><small>JPG, PNG, WebP, or GIF · max 5 MB</small></div>
    <input type="hidden" name="avatar_url" value={avatarPath}/>
    <div className="form-grid"><label className="field"><span>FIRST NAME</span><input name="firstname" required maxLength={100} defaultValue={firstName}/></label><label className="field"><span>LAST NAME</span><input name="lastname" required maxLength={100} defaultValue={lastName}/></label></div>
    {uploadError && <div className="alert" role="alert">{uploadError}</div>}
    {state.error && <div className="alert" role="alert">{state.error}</div>}
    {state.success && <div className="success-note" role="status">{state.success}</div>}
    <div className="form-footer"><span>Admin access stays attached to your account.</span><button className="solid-button" type="submit" disabled={pending || uploading}>{pending ? "SAVING..." : "SAVE PROFILE"}</button></div>
  </form>;
}
