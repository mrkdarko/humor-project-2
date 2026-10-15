import Link from "next/link";
import { Search, UsersRound } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { pageNumber } from "@/lib/format";
import { CopyId } from "./copy-id";

type Profile = { id: string; firstname: string | null; lastname: string | null; avatar_url: string | null; is_superadmin: boolean };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const { supabase } = await requireAdmin();
  const query = await searchParams;
  const page = pageNumber(query.page);
  const q = (query.q || "").trim().slice(0, 60);
  let request = supabase.from("profiles").select("id, firstname, lastname, avatar_url, is_superadmin", { count: "exact" }).order("firstname", { ascending: true }).range((page - 1) * 25, page * 25 - 1);
  const safeQuery = q.replace(/[^a-zA-Z0-9 -]/g, "").trim();
  if (safeQuery) request = request.or(`firstname.ilike.%${safeQuery}%,lastname.ilike.%${safeQuery}%`);
  const { data, count, error } = await request;
  const profiles = (data || []) as Profile[];
  const total = count || 0;
  const pages = Math.max(1, Math.ceil(total / 25));
  return <>
    <div className="page-heading"><div><div className="eyebrow dark">PEOPLE <span>●</span> COMMUNITY DIRECTORY</div><h1>Know your crowd<span className="heading-spark">✳</span></h1><p>Every registered profile, all in one place.</p></div><div className="heading-count"><UsersRound size={20}/><strong>{total}</strong><span>profiles</span></div></div>
    <section className="panel table-panel"><div className="section-toolbar"><div><h2>Profiles</h2><p>Read only directory of your community</p></div><form className="search-form" action="/admin/users"><Search size={17}/><input aria-label="Search profiles" name="q" defaultValue={q} placeholder="Search names"/><button type="submit">Search</button></form></div>
    {error ? <div className="alert" role="alert">Could not load profiles: {error.message}</div> : <div className="table-wrap"><table><thead><tr><th>PROFILE</th><th>USER ID</th><th>ACCESS</th><th>AVATAR</th></tr></thead><tbody>{profiles.map(profile => { const name = [profile.firstname, profile.lastname].filter(Boolean).join(" ") || "Unnamed profile"; return <tr key={profile.id}><td><div className="person-cell"><span className="person-avatar">{name.charAt(0).toUpperCase()}</span><strong>{name}</strong></div></td><td><CopyId id={profile.id}/></td><td><span className={`pill ${profile.is_superadmin ? "pill-admin" : "pill-member"}`}>{profile.is_superadmin ? "Superadmin" : "Member"}</span></td><td>{profile.avatar_url ? <span className="muted">On file</span> : <span className="muted">None</span>}</td></tr>; })}</tbody></table>{!profiles.length && <div className="empty-state">{q ? "No profiles match that search." : "No profiles yet."}</div>}</div>}
    <div className="pagination"><span>Showing {profiles.length ? (page - 1) * 25 + 1 : 0}–{Math.min(page * 25, total)} of {total}</span><div><Link aria-disabled={page <= 1} className={page <= 1 ? "disabled" : ""} href={`/admin/users?page=${Math.max(1,page - 1)}&q=${encodeURIComponent(q)}`}>← Previous</Link><span>Page {page} / {pages}</span><Link aria-disabled={page >= pages} className={page >= pages ? "disabled" : ""} href={`/admin/users?page=${Math.min(pages,page + 1)}&q=${encodeURIComponent(q)}`}>Next →</Link></div></div></section>
  </>;
}

