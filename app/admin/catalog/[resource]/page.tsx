import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { fieldLabel, getResource } from "@/lib/admin-catalog";
import { pageNumber } from "@/lib/format";

function cell(value: unknown) {
  if (value === null || value === undefined || value === "") return <span className="muted">—</span>;
  if (typeof value === "boolean") return <span className={`pill ${value ? "pill-admin" : "pill-member"}`}>{value ? "Enabled" : "Disabled"}</span>;
  const string = String(value);
  if (/^\d{4}-\d\d-\d\dT/.test(string)) return new Date(string).toLocaleString();
  return <span title={string} className="catalog-cell">{string}</span>;
}

export default async function CatalogPage({ params, searchParams }: { params: Promise<{ resource: string }>; searchParams: Promise<{ page?: string; saved?: string; deleted?: string }> }) {
  const { resource: slug } = await params;
  const { supabase } = await requireAdmin();
  const resource = getResource(slug);
  if (!resource) notFound();
  const query = await searchParams;
  const page = pageNumber(query.page);
  const { data, count, error } = await supabase.from(resource.table).select("*", { count: "exact" }).order(resource.orderBy || "created_at", { ascending: false }).range((page - 1) * 25, page * 25 - 1);
  const rows = (data || []) as Record<string, unknown>[];
  const relation = slug === "prompt-steps" || slug === "prompt-mix" ? { key: "chain_id", table: "prompt_chains" } : slug === "models" ? { key: "provider_id", table: "llm_providers" } : slug === "llm-responses" ? { key: "model_id", table: "llm_models" } : null;
  const ids = relation ? rows.map(row => row[relation.key]).filter((value): value is string => typeof value === "string") : [];
  const related = relation && ids.length ? (await supabase.from(relation.table).select("id, name").in("id", ids)).data || [] : [];
  const names = new Map(related.map(item => [item.id, item.name]));
  const total = count || 0;
  const pages = Math.max(1, Math.ceil(total / 25));
  const base = `/admin/catalog/${slug}`;
  return <>
    <div className="page-heading"><div><div className="eyebrow dark">CONTROL ROOM <span>●</span> DATA LIBRARY</div><h1>{resource.title}<span className="heading-spark">✳</span></h1><p>{resource.description}</p></div>{resource.canCreate && <Link className="solid-button" href={`${base}/new`}><Plus size={18}/> New record</Link>}</div>
    {(query.saved || query.deleted) && <div className="success-note" role="status">Record {query.deleted ? "deleted" : "saved"} successfully.</div>}
    <section className="panel table-panel"><div className="section-toolbar"><div><h2>Records <span className="toolbar-count">{total}</span></h2><p>{resource.canEdit ? "Open a record to review and edit it." : "Read only records from the live database."}</p></div></div>
    {error ? <div className="alert" role="alert">Could not load {resource.title.toLowerCase()}: {error.message}. Check that admin_catalog.sql has been applied.</div> : <div className="table-wrap"><table><thead><tr>{resource.columns.map(column => <th key={column}>{fieldLabel(column)}</th>)}<th>View</th></tr></thead><tbody>{rows.map(row => <tr key={String(row.id)}>{resource.columns.map(column => <td key={column}>{relation?.key === column && typeof row[column] === "string" && names.has(row[column]) ? <span title={row[column]}>{names.get(row[column])}</span> : cell(row[column])}</td>)}<td><Link className="row-link" href={`${base}/${row.id}`} aria-label={`View ${resource.title} record`}><ArrowUpRight size={18}/></Link></td></tr>)}</tbody></table>{rows.length === 0 && <div className="empty-state"><span>✳</span><strong>No records yet</strong><p>{resource.canCreate ? "Create the first record to get started." : "Records will appear here when the AI workflow writes them."}</p></div>}</div>}
    {!error && <div className="pagination"><span>Showing {rows.length ? (page - 1) * 25 + 1 : 0}–{Math.min(page * 25, total)} of {total}</span><div><Link aria-disabled={page <= 1} className={page <= 1 ? "disabled" : ""} href={`${base}?page=${Math.max(1, page - 1)}`}>← Previous</Link><span>Page {page} / {pages}</span><Link aria-disabled={page >= pages} className={page >= pages ? "disabled" : ""} href={`${base}?page=${Math.min(pages, page + 1)}`}>Next →</Link></div></div>}</section>
  </>;
}
