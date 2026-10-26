import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Sparkles, UsersRound, Clapperboard, ThumbsUp, Clock3, ImageIcon, Type } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { compact } from "@/lib/format";
import { one } from "@/lib/one";

type Overview = {
  users: number; media: number; text_media: number; photo_media: number; queued: number;
  upvotes: number; downvotes: number; photo_upvotes: number; photo_downvotes: number;
  topics: { topic: string; count: number; photos: number }[];
  daily: { day: string; media: number; text: number; photos: number; votes: number }[];
  leaders: { id: string; content: string; topic: string; is_photo: boolean; score: number; upvotes: number; downvotes: number }[];
};

type Photo = { image_path: string; image_alt: string | null; topic: string; captions: { id: string; content: string } | null };
const empty: Overview = { users: 0, media: 0, text_media: 0, photo_media: 0, queued: 0, upvotes: 0, downvotes: 0, photo_upvotes: 0, photo_downvotes: 0, topics: [], daily: [], leaders: [] };

export default async function OverviewPage() {
  const { supabase, profile } = await requireAdmin();
  const [{ data, error }, { data: photoRows }] = await Promise.all([
    supabase.rpc("admin_overview"),
    supabase.from("generations").select("image_path, image_alt, topic, captions(id, content)")
      .not("image_path", "is", null).eq("status", "ready").order("created_at", { ascending: false }).limit(3),
  ]);
  const stats = (data || empty) as Overview;
  const photos = (photoRows || []).map(row => ({ ...row, captions: one(row.captions) })) as Photo[];
  const paths = photos.map(photo => photo.image_path);
  const { data: signedPhotos } = paths.length
    ? await supabase.storage.from("meme-images").createSignedUrls(paths, 3600)
    : { data: [] };
  const photoUrls = new Map((signedPhotos || []).map(photo => [photo.path, photo.signedUrl]));
  const votes = Number(stats.upvotes) + Number(stats.downvotes);
  const approval = votes ? Math.round(Number(stats.upvotes) / votes * 100) : 0;
  const photoVotes = Number(stats.photo_upvotes) + Number(stats.photo_downvotes);
  const photoShare = Number(stats.media) ? Math.round(Number(stats.photo_media) / Number(stats.media) * 100) : 0;
  const maxDay = Math.max(1, ...stats.daily.map(d => Number(d.media)));
  const maxTopic = Math.max(1, ...stats.topics.map(t => Number(t.count)));
  const firstName = profile.firstname?.trim() || "Admin";
  return <>
    <div className="page-heading overview-heading"><div><div className="eyebrow dark">OVERVIEW <span>●</span> YOUR COMMUNITY AT A GLANCE</div><h1>Good morning, {firstName}<span className="heading-spark">✳</span></h1><p>Here’s what the Humor Project has been up to.</p></div><div className="today-stamp"><span>CONTROL ROOM</span><strong>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date())}</strong></div></div>
    {error && <div className="alert" role="alert">Could not load statistics: {error.message}</div>}
    <section className="metrics-grid" aria-label="Key metrics">
      <Metric icon={<UsersRound size={20}/>} label="Community members" value={stats.users} note="Registered profiles" accent="peach" href="/admin/users"/>
      <Metric icon={<Clapperboard size={20}/>} label="Published media" value={stats.media} note="All memes" accent="lime" href="/admin/media"/>
      <Metric icon={<Type size={20}/>} label="Text memes" value={stats.text_media} note="Caption only" accent="blue" href="/admin/media"/>
      <Metric icon={<ImageIcon size={20}/>} label="Photo memes" value={stats.photo_media} note={`${photoShare}% of published media`} accent="pink" href="/admin/media"/>
      <Metric icon={<ThumbsUp size={20}/>} label="Total reactions" value={votes} note={`${approval}% positive signal`} accent="violet" href="/admin/ratings"/>
      <Metric icon={<Clock3 size={20}/>} label="In the queue" value={stats.queued} note="Generations awaiting media" accent="yellow" href="/admin/media"/>
    </section>
    <div className="insight-grid">
      <section className="panel trend-panel"><div className="panel-heading"><div><div className="eyebrow dark">THE PULSE</div><h2>Creative momentum</h2><p>Text and photo memes published over seven days</p></div><Sparkles size={22}/></div><div className="chart-legend"><span><i className="text-swatch"/> Text memes</span><span><i className="photo-swatch"/> Photo memes</span></div><div className="bar-chart" aria-label="Daily published text and photo memes">{stats.daily.map((d, i) => <div className="bar-group" key={d.day}><span className="bar-number">{d.media || ""}</span><div className="bar-track"><div className="bar-stack" style={{height:`${Number(d.media) / maxDay * 100}%`}}><div className="bar-photo" style={{height:`${Number(d.media) ? Number(d.photos) / Number(d.media) * 100 : 0}%`}}/><div className="bar-text" style={{height:`${Number(d.media) ? Number(d.text) / Number(d.media) * 100 : 0}%`}}/></div></div><span className="bar-label">{new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(new Date(d.day))}</span>{i === stats.daily.length - 1 && <span className="bar-today">TODAY</span>}</div>)}</div></section>
      <section className="panel sentiment-panel"><div className="panel-heading"><div><div className="eyebrow dark">AUDIENCE SIGNAL</div><h2>The laugh meter</h2><p>How the community is responding</p></div><span className="panel-mini-icon">↗</span></div><div className="sentiment-center"><div className="donut" style={{"--percent": `${approval}%`} as React.CSSProperties}><div><strong>{approval}%</strong><span>POSITIVE</span></div></div><div className="sentiment-legend"><div><span className="legend-dot up"/> Upvotes <strong>{compact(stats.upvotes)}</strong></div><div><span className="legend-dot down"/> Downvotes <strong>{compact(stats.downvotes)}</strong></div></div></div></section>
    </div>
    <section className="panel photo-panel" aria-label="Photo meme statistics"><div className="panel-heading"><div><div className="eyebrow dark">PHOTO MEMES</div><h2>Picture this</h2><p>How image memes are performing in the community</p></div><Link className="text-link" href="/admin/media">View all <ArrowUpRight size={15}/></Link></div><div className="photo-summary"><div><strong>{photoShare}%</strong><span>OF ALL POSTS</span></div><div><strong>{compact(photoVotes)}</strong><span>PHOTO REACTIONS</span></div><div><strong>{compact(stats.photo_upvotes)}</strong><span>UPVOTES</span></div><div><strong>{compact(stats.photo_downvotes)}</strong><span>DOWNVOTES</span></div></div><div className="photo-gallery">{photos.length ? photos.map(photo => <Link className="photo-tile" key={photo.image_path} href={photo.captions ? `/admin/media/${photo.captions.id}` : "/admin/media"}><div className="photo-tile-image">{photoUrls.get(photo.image_path) ? <Image src={photoUrls.get(photo.image_path)!} alt={photo.image_alt || "Community photo meme"} fill unoptimized sizes="(max-width: 720px) 100vw, 300px" /> : <ImageIcon size={28} aria-label="Photo unavailable"/>}</div><div><strong>{photo.captions?.content || "Photo meme"}</strong><small>{photo.topic} · PHOTO</small></div></Link>) : <p className="empty-inline">Published photo memes will appear here.</p>}</div></section>
    <div className="insight-grid lower-grid">
      <section className="panel topics-panel"><div className="panel-heading"><div><div className="eyebrow dark">CONTENT MIX</div><h2>What’s making people laugh</h2></div><Link className="text-link" href="/admin/media">View media <ArrowUpRight size={15}/></Link></div><div className="topic-list">{stats.topics.length ? stats.topics.map((t, i) => <div className="topic-row" key={t.topic}><span className="topic-index">0{i + 1}</span><div className="topic-detail"><div><strong>{t.topic}</strong><span>{t.count} posts · {t.photos} photos</span></div><div className="topic-track"><div style={{ width: `${Number(t.count) / maxTopic * 100}%` }}/></div></div></div>) : <p className="empty-inline">No published media yet. Add the first caption to begin.</p>}</div></section>
      <section className="panel leaders-panel"><div className="panel-heading"><div><div className="eyebrow dark">CROWD FAVORITES</div><h2>Top rated media</h2></div><Link className="text-link" href="/admin/media">See all <ArrowUpRight size={15}/></Link></div><div className="leader-list">{stats.leaders.length ? stats.leaders.map((item, i) => <Link href={`/admin/media/${item.id}`} className="leader-row" key={item.id}><span className="leader-rank">{String(i + 1).padStart(2,"0")}</span><div><strong>{item.content}</strong><small>{item.topic} · {item.is_photo ? "PHOTO" : "TEXT"}</small></div><span className="leader-score"><ThumbsUp size={14}/>{item.score}</span></Link>) : <p className="empty-inline">Community favorites will appear after media gets rated.</p>}</div></section>
    </div>
    <div className="overview-bottom"><span>MAKE THE ROOM YOURS.</span><p>Browse profiles, curate AI media, and follow the community signal.</p><Link href="/admin/media/new" className="solid-button">Create media <ArrowUpRight size={18}/></Link></div>
  </>;
}

function Metric({ icon, label, value, note, accent, href }: { icon: React.ReactNode; label: string; value: number; note: string; accent: string; href: string }) {
  return <Link href={href} className={`metric-card ${accent}`}><div className="metric-top"><span className="metric-icon">{icon}</span><ArrowUpRight size={18}/></div><span className="metric-label">{label}</span><strong>{compact(Number(value))}</strong><small>{note}</small></Link>;
}
