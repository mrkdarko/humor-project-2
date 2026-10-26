import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { one } from "@/lib/one";
import { MediaForm } from "../media-form";
import { DeleteButton } from "../delete-button";

type Media = { id: string; content: string; created_at: string; generations: { user_id: string; prompt: string; topic: string; provider: string; image_path: string | null; image_alt: string | null } | null };

export default async function EditMediaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  const { data, error } = await supabase.from("captions").select("id, content, created_at, generations(user_id, prompt, topic, provider, image_path, image_alt)").eq("id", id).maybeSingle();
  if (error || !data) notFound();
  const media = { ...data, generations: one(data.generations) } as Media;
  if (!media.generations) notFound();
  const { data: signedPhoto } = media.generations.image_path
    ? await supabase.storage.from("meme-images").createSignedUrl(media.generations.image_path, 3600)
    : { data: null };
  return <><div className="page-heading"><div><div className="eyebrow dark"><Link href="/admin/media">AI MEDIA</Link> <span>●</span> EDIT ENTRY</div><h1>Edit media<span className="heading-spark">✳</span></h1><p>Published {dateTime(media.created_at)} · {media.generations.topic} · {media.generations.image_path ? "Photo meme" : "Text meme"}</p></div></div>{query.saved && <div className="success-note" role="status">Changes saved successfully.</div>}{media.generations.image_path && <section className="panel media-detail-photo"><div><div className="eyebrow dark">ORIGINAL PHOTO</div><h2>Image meme preview</h2></div><div className="media-detail-image">{signedPhoto?.signedUrl ? <Image src={signedPhoto.signedUrl} alt={media.generations.image_alt || "Community photo meme"} fill unoptimized sizes="(max-width: 720px) 100vw, 720px"/> : <p>Photo unavailable</p>}</div></section>}<div className="form-layout"><section className="panel form-panel"><div className="form-panel-heading"><span className="step-number">01</span><div><h2>Media details</h2><p>Update the caption and its source information.</p></div></div><MediaForm mode="edit" values={{ id: media.id, user_id: media.generations.user_id, prompt: media.generations.prompt, topic: media.generations.topic, provider: media.generations.provider, content: media.content }}/></section><aside className="form-aside"><div className="aside-star">✳</div><h3>Keep the archive sharp.</h3><p>Editing updates the live community post. Deleting removes the generation, caption, and associated votes.</p><div className="aside-divider"/><DeleteButton id={media.id}/></aside></div></>;
}

