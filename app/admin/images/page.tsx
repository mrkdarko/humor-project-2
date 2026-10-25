import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { pageNumber } from "@/lib/format";

export default async function ImagesPage({ searchParams }: { searchParams: Promise<{ page?: string; saved?: string; deleted?: string }> }) {
  const { supabase } = await requireAdmin();
  const query = await searchParams;
  const page = pageNumber(query.page);
  const { data, count, error } = await supabase.from("images").select("id, title, alt_text, storage_path, created_at", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * 20, page * 20 - 1);
  const images = await Promise.all((data || []).map(async row => {
    const { data: signed } = await supabase.storage.from("admin-images").createSignedUrl(row.storage_path, 300);
    return { ...row, url: signed?.signedUrl || "" };
  }));
  const total = count || 0;
  const pages = Math.max(1, Math.ceil(total / 20));
  return <><div className="page-heading"><div><div className="eyebrow dark">AI MEDIA <span>●</span> IMAGE LIBRARY</div><h1>Images<span className="heading-spark">✳</span></h1><p>Upload, review, replace, and remove private images.</p></div><Link className="solid-button" href="/admin/images/new"><Plus size={18}/> Upload image</Link></div>{(query.saved || query.deleted) && <div className="success-note" role="status">Image {query.deleted ? "deleted" : "saved"} successfully.</div>}
    {error ? <div className="alert" role="alert">Could not load images: {error.message}. Check that admin_catalog.sql has been applied.</div> : <section className="catalog-image-grid">{images.map(item => <Link key={item.id} href={`/admin/images/${item.id}`} className="panel catalog-image-card"><div className="catalog-image-frame">{item.url ? <Image src={item.url} fill sizes="(max-width: 720px) 100vw, 250px" unoptimized alt={item.alt_text || item.title}/> : <span>Preview unavailable</span>}</div><strong>{item.title}</strong><small>{new Date(item.created_at).toLocaleString()}</small></Link>)}{images.length === 0 && <div className="panel empty-state"><span>🖼️</span><strong>No images yet</strong><p>Upload one to start the private library.</p></div>}</section>}
    {!error && <div className="pagination catalog-image-pagination"><span>Showing {images.length ? (page - 1) * 20 + 1 : 0}–{Math.min(page * 20, total)} of {total}</span><div><Link aria-disabled={page <= 1} className={page <= 1 ? "disabled" : ""} href={`/admin/images?page=${Math.max(1, page - 1)}`}>← Previous</Link><span>Page {page} / {pages}</span><Link aria-disabled={page >= pages} className={page >= pages ? "disabled" : ""} href={`/admin/images?page=${Math.min(pages, page + 1)}`}>Next →</Link></div></div>}</>;
}
