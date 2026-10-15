import Link from "next/link";
import { ArrowUpRight, Sparkles, UsersRound, Clapperboard, ThumbsUp, Clock3 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { compact } from "@/lib/format";

type Overview = {
  users: number; media: number; queued: number; upvotes: number; downvotes: number;
  topics: { topic: string; count: number }[];
  daily: { day: string; media: number; votes: number }[];
  leaders: { id: string; content: string; topic: string; score: number; upvotes: number; downvotes: number }[];
};

const empty: Overview = { users: 0, media: 0, queued: 0, upvotes: 0, downvotes: 0, topics: [], daily: [], leaders: [] };

export default async function OverviewPage() {
  const { supabase, profile } = await requireAdmin();
  const { data, error } = await supabase.rpc("admin_overview");
  const stats = (data || empty) as Overview;
  const votes = Number(stats.upvotes) + Number(stats.downvotes);
  const approval = votes ? Math.round(Number(stats.upvotes) / votes * 100) : 0;
  const maxDay = Math.max(1, ...stats.daily.map(d => Number(d.media)));
  const maxTopic = Math.max(1, ...stats.topics.map(t => Number(t.count)));
  const firstName = profile.firstname?.trim() || "Admin";
  return <>
    <div className="page-heading overview-heading"><div><div className="eyebrow dark">OVERVIEW <span>●</span> YOUR COMMUNITY AT A GLANCE</div><h1>Good morning, {firstName}<span className="heading-spark">✳</span></h1><p>Here’s what the Humor Project has been up to.</p></div><div className="today-stamp"><span>CONTROL ROOM</span><strong>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date())}</strong></div></div>
    {error && <div className="alert" role="alert">Could not load statistics. Apply <code>supabase/admin_setup.sql</code> to the Humor Project database.</div>}
    <section className="metrics-grid" aria-label="Key metrics">
      <Metric icon={<UsersRound size={20}/>} label="Community members" value={stats.users} note="Registered profiles" accent="peach" href="/admin/users"/>
      <Metric icon={<Clapperboard size={20}/>} label="AI media" value={stats.media} note="Published captions" accent="lime" href="/admin/media"/>
      <Metric icon={<ThumbsUp size={20}/>} label="Total reactions" value={votes} note={`${approval}% positive signal`} accent="violet" href="/admin/ratings"/>
      <Metric icon={<Clock3 size={20}/>} label="In the queue" value={stats.queued} note="Generations awaiting media" accent="yellow" href="/admin/media"/>
    </section>
    <div className="insight-grid">
      <section className="panel trend-panel"><div className="panel-heading"><div><div className="eyebrow dark">THE PULSE</div><h2>Creative momentum</h2><p>Published media across the past seven days</p></div><Sparkles size={22}/></div><div className="bar-chart" aria-label="Daily published media">{stats.daily.map((d, i) => <div className="bar-group" key={d.day}><span className="bar-number">{d.media || ""}</span><div className="bar-track"><div className="bar-fill" style={{height:`${Math.max(6, Number(d.media) / maxDay * 100)}%`}}/></div><span className="bar-label">{new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(new Date(d.day))}</span>{i === stats.daily.length - 1 && <span className="bar-today">TODAY</span>}</div>)}</div></section>
      <section className="panel sentiment-panel"><div className="panel-heading"><div><div className="eyebrow dark">AUDIENCE SIGNAL</div><h2>The laugh meter</h2><p>How the community is responding</p></div><span className="panel-mini-icon">↗</span></div><div className="sentiment-center"><div className="donut" style={{"--percent": `${approval}%`} as React.CSSProperties}><div><strong>{approval}%</strong><span>POSITIVE</span></div></div><div className="sentiment-legend"><div><span className="legend-dot up"/> Upvotes <strong>{compact(stats.upvotes)}</strong></div><div><span className="legend-dot down"/> Downvotes <strong>{compact(stats.downvotes)}</strong></div></div></div></section>
    </div>
    <div className="insight-grid lower-grid">
      <section className="panel topics-panel"><div className="panel-heading"><div><div className="eyebrow dark">CONTENT MIX</div><h2>What’s making people laugh</h2></div><Link className="text-link" href="/admin/media">View media <ArrowUpRight size={15}/></Link></div><div className="topic-list">{stats.topics.length ? stats.topics.map((t, i) => <div className="topic-row" key={t.topic}><span className="topic-index">0{i + 1}</span><div className="topic-detail"><div><strong>{t.topic}</strong><span>{t.count} posts</span></div><div className="topic-track"><div style={{ width: `${Number(t.count) / maxTopic * 100}%` }}/></div></div></div>) : <p className="empty-inline">No published media yet. Add the first caption to begin.</p>}</div></section>
      <section className="panel leaders-panel"><div className="panel-heading"><div><div className="eyebrow dark">CROWD FAVORITES</div><h2>Top rated media</h2></div><Link className="text-link" href="/admin/media">See all <ArrowUpRight size={15}/></Link></div><div className="leader-list">{stats.leaders.length ? stats.leaders.map((item, i) => <Link href={`/admin/media/${item.id}`} className="leader-row" key={item.id}><span className="leader-rank">{String(i + 1).padStart(2,"0")}</span><div><strong>{item.content}</strong><small>{item.topic}</small></div><span className="leader-score"><ThumbsUp size={14}/>{item.score}</span></Link>) : <p className="empty-inline">Community favorites will appear after media gets rated.</p>}</div></section>
    </div>
    <div className="overview-bottom"><span>MAKE THE ROOM YOURS.</span><p>Browse profiles, curate AI media, and follow the community signal.</p><Link href="/admin/media/new" className="solid-button">Create media <ArrowUpRight size={18}/></Link></div>
  </>;
}

function Metric({ icon, label, value, note, accent, href }: { icon: React.ReactNode; label: string; value: number; note: string; accent: string; href: string }) {
  return <Link href={href} className={`metric-card ${accent}`}><div className="metric-top"><span className="metric-icon">{icon}</span><ArrowUpRight size={18}/></div><span className="metric-label">{label}</span><strong>{compact(Number(value))}</strong><small>{note}</small></Link>;
}
