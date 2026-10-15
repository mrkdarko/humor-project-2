import Link from "next/link";
import { ArrowUpRight, Clapperboard, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { dateTime, pageNumber, shortId } from "@/lib/format";
import { one } from "@/lib/one";

type Media = { id: string; content: string; created_at: string; generation_id: string; generations: { user_id: string; topic: string; provider: string; prompt: string; status: string } | null };

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ page?: string; created?: string; deleted?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const page = pageNumber(params.page);
  const { data, count, error } = await supabase.from("captions")
    .select("id, content, created_at, generation_id, generations(user_id, topic, provider, prompt, status)", { count: "exact" })
    .order("created_at", { ascending: false }).range((page - 1) * 20, page * 20 - 1);
  const media = (data || []).map(row => ({ ...row, generations: one(row.generations) })) as Media[];
  const total = count || 0;
  const pages = Math.max(1, Math.ceil(total / 20));
  return <>
    <div className="page-heading"><div><div className="eyebrow dark">AI MEDIA <span>●</span> CURATION DESK</div><h1>The creative archive<span className="heading-spark">✳</span></h1><p>Publish, refine, and manage AI generated captions.</p></div><Link href="/admin/media/new" className="solid-button"><Plus size={18}/> Create media</Link></div>
    {params.created && <div className="success-note" role="status">Media published successfully.</div>}{params.deleted && <div className="success-note" role="status">Media deleted successfully.</div>}
    <section className="panel table-panel"><div className="section-toolbar"><div><h2>Published media <span className="toolbar-count">{total}</span></h2><p>Browse your complete caption library</p></div><span className="mini-tag"><Clapperboard size={15}/> LIVE LIBRARY</span></div>
    {error ? <div className="alert" role="alert">Could not load media: {error.message}</div> : <div className="table-wrap"><table><thead><tr><th>CAPTION</th><th>TOPIC</th><th>PROVIDER</th><th>PUBLISHED</th><th></th></tr></thead><tbody>{media.map(row => <tr key={row.id}><td><Link href={`/admin/media/${row.id}`} className="caption-cell"><strong>{row.content}</strong><small>ID {shortId(row.id)}</small></Link></td><td><span className="pill pill-topic">{row.generations?.topic || "—"}</span></td><td>{row.generations?.provider || "—"}</td><td className="muted">{dateTime(row.created_at)}</td><td><Link aria-label={`Edit ${row.content.slice(0,20)}`} href={`/admin/media/${row.id}`} className="row-link"><ArrowUpRight size={18}/></Link></td></tr>)}</tbody></table>{!media.length && <div className="empty-state"><span>✳</span><strong>The archive is waiting.</strong><p>Publish your first AI generated caption.</p><Link href="/admin/media/new">Create media ↗</Link></div>}</div>}
    <div className="pagination"><span>Showing {media.length ? (page - 1) * 20 + 1 : 0}–{Math.min(page * 20, total)} of {total}</span><div><Link aria-disabled={page <= 1} className={page <= 1 ? "disabled" : ""} href={`/admin/media?page=${Math.max(1,page - 1)}`}>← Previous</Link><span>Page {page} / {pages}</span><Link aria-disabled={page >= pages} className={page >= pages ? "disabled" : ""} href={`/admin/media?page=${Math.min(pages,page + 1)}`}>Next →</Link></div></div></section>
  </>;
}

