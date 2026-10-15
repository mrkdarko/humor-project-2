import Link from "next/link";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { dateTime, pageNumber, shortId } from "@/lib/format";
import { one } from "@/lib/one";

type Vote = { id: string; value: number; user_id: string; caption_id: string; created_at: string; captions: { content: string } | null };

export default async function RatingsPage({ searchParams }: { searchParams: Promise<{ page?: string; filter?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const page = pageNumber(params.page);
  const filter = params.filter === "up" || params.filter === "down" ? params.filter : "all";
  let request = supabase.from("caption_votes").select("id, value, user_id, caption_id, created_at, captions(content)", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * 30, page * 30 - 1);
  if (filter !== "all") request = request.eq("value", filter === "up" ? 1 : -1);
  const { data, count, error } = await request;
  const votes = (data || []).map(row => ({ ...row, captions: one(row.captions) })) as Vote[];
  const total = count || 0;
  const pages = Math.max(1, Math.ceil(total / 30));
  return <><div className="page-heading"><div><div className="eyebrow dark">REACTIONS <span>●</span> COMMUNITY SIGNAL</div><h1>Every vote tells a story<span className="heading-spark">✳</span></h1><p>Read upvotes and downvotes as they happen.</p></div><div className="heading-count"><ThumbsUp size={20}/><strong>{total}</strong><span>reactions</span></div></div><section className="panel table-panel"><div className="section-toolbar"><div><h2>Reaction ledger</h2><p>A chronological view of community ratings</p></div><div className="filter-tabs" role="group" aria-label="Filter reactions"><Link className={filter === "all" ? "selected" : ""} href="/admin/ratings?filter=all">All</Link><Link className={filter === "up" ? "selected" : ""} href="/admin/ratings?filter=up">Upvotes</Link><Link className={filter === "down" ? "selected" : ""} href="/admin/ratings?filter=down">Downvotes</Link></div></div>{error ? <div className="alert" role="alert">Could not load reactions: {error.message}</div> : <div className="table-wrap"><table><thead><tr><th>RATING</th><th>MEDIA</th><th>VOTER ID</th><th>WHEN</th></tr></thead><tbody>{votes.map(vote => <tr key={vote.id}><td><span className={`vote-badge ${vote.value === 1 ? "positive" : "negative"}`}>{vote.value === 1 ? <ThumbsUp size={15}/> : <ThumbsDown size={15}/>} {vote.value === 1 ? "Upvote" : "Downvote"}</span></td><td><Link className="rating-caption" href={`/admin/media/${vote.caption_id}`}>{vote.captions?.content || "Deleted media"}</Link></td><td><code title={vote.user_id}>{shortId(vote.user_id)}</code></td><td className="muted">{dateTime(vote.created_at)}</td></tr>)}</tbody></table>{!votes.length && <div className="empty-state">No reactions in this view yet.</div>}</div>}<div className="pagination"><span>Showing {votes.length ? (page - 1) * 30 + 1 : 0}–{Math.min(page * 30, total)} of {total}</span><div><Link aria-disabled={page <= 1} className={page <= 1 ? "disabled" : ""} href={`/admin/ratings?page=${Math.max(1,page - 1)}&filter=${filter}`}>← Previous</Link><span>Page {page} / {pages}</span><Link aria-disabled={page >= pages} className={page >= pages ? "disabled" : ""} href={`/admin/ratings?page=${Math.min(pages,page + 1)}&filter=${filter}`}>Next →</Link></div></div></section></>;
}
