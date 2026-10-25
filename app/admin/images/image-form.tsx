"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteImage, saveImage } from "./actions";

const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

export function ImageForm({ userId, row, preview }: { userId: string; row?: { id: string; title: string; alt_text: string; storage_path: string }; preview?: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    let uploadedPath = "";
    if (file) {
      if (!extensions[file.type] || file.size > 5 * 1024 * 1024) { setError("Choose a JPG, PNG, WebP, or GIF under 5 MB."); setBusy(false); return; }
      uploadedPath = `${userId}/${crypto.randomUUID()}.${extensions[file.type]}`;
      const { error: uploadError } = await createClient().storage.from("admin-images").upload(uploadedPath, file, { contentType: file.type });
      if (uploadError) { setError(uploadError.message); setBusy(false); return; }
      form.set("storage_path", uploadedPath);
    }
    const saved = await saveImage(form);
    if (saved.error) {
      if (uploadedPath) await createClient().storage.from("admin-images").remove([uploadedPath]);
      setError(saved.error); setBusy(false); return;
    }
    router.push("/admin/images?saved=1"); router.refresh();
  }
  async function remove() {
    if (!row || !window.confirm("Delete this image permanently?")) return;
    setBusy(true); setError("");
    const result = await deleteImage(row.id);
    if (result.error) { setError(result.error); setBusy(false); return; }
    router.push("/admin/images?deleted=1"); router.refresh();
  }
  return <div className="form-layout"><section className="panel form-panel"><div className="form-panel-heading"><span className="step-number">01</span><div><h2>Image details</h2><p>JPG, PNG, WebP, or GIF · up to 5 MB</p></div></div><form onSubmit={submit} className="media-form"><input type="hidden" name="id" value={row?.id || ""}/>{preview && <Image src={preview} width={360} height={240} unoptimized alt={row?.alt_text || row?.title || "Image preview"} className="catalog-image-preview"/>}<label className="field"><span>{row ? "REPLACE IMAGE" : "IMAGE *"}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" required={!row} onChange={event => setFile(event.target.files?.[0])}/></label><label className="field"><span>TITLE *</span><input name="title" required maxLength={160} defaultValue={row?.title}/></label><label className="field"><span>ALT TEXT</span><textarea name="alt_text" maxLength={500} rows={3} defaultValue={row?.alt_text}/></label>{error && <div className="alert" role="alert">{error}</div>}<div className="form-footer"><span>Images are stored privately.</span><button className="solid-button" disabled={busy} type="submit">{busy ? "Saving..." : row ? "Save image" : "Upload image"}</button></div></form></section><aside className="form-aside"><div className="aside-star">✳</div><h3>Image library</h3><p>Only superadmins can browse this bucket. Previews use short lived signed URLs.</p>{row && <><div className="aside-divider"/><button type="button" className="danger-button" disabled={busy} onClick={remove}>Delete image</button></>}</aside></div>;
}
