import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ImageForm } from "../image-form";

export default async function ImageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();
  const { data: row, error } = await supabase.from("images").select("id, title, alt_text, storage_path").eq("id", id).maybeSingle();
  if (error || !row) notFound();
  const { data: signed } = await supabase.storage.from("admin-images").createSignedUrl(row.storage_path, 300);
  return <><div className="page-heading"><div><div className="eyebrow dark"><Link href="/admin/images">IMAGES</Link> <span>●</span> EDIT</div><h1>Edit image<span className="heading-spark">✳</span></h1><p>{row.title}</p></div></div><ImageForm userId={user.id} row={row} preview={signed?.signedUrl}/></>;
}
