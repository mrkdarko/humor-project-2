import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { fieldLabel, getResource } from "@/lib/admin-catalog";
import { CatalogForm } from "../../catalog-form";
import { CatalogDeleteButton } from "../../delete-button";

export default async function CatalogDetailPage({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource: slug, id } = await params;
  const { supabase } = await requireAdmin();
  const resource = getResource(slug);
  if (!resource) notFound();
  const { data: row, error } = await supabase.from(resource.table).select("*").eq("id", id).maybeSingle();
  if (error || !row) notFound();
  const providers = slug === "models" ? (await supabase.from("llm_providers").select("id, name").order("name")).data || [] : [];
  return <><div className="page-heading"><div><div className="eyebrow dark"><Link href={`/admin/catalog/${slug}`}>{resource.title}</Link> <span>●</span> RECORD</div><h1>{resource.canEdit ? "Edit" : "View"} {resource.title.toLowerCase()}<span className="heading-spark">✳</span></h1><p>ID: {id}</p></div></div><div className="form-layout"><section className="panel form-panel"><div className="form-panel-heading"><span className="step-number">01</span><div><h2>{resource.canEdit ? "Record details" : "Full record"}</h2><p>{resource.description}</p></div></div>{resource.canEdit ? <CatalogForm resource={resource} row={row} providers={providers}/> : <dl className="record-details">{Object.entries(row).map(([key, value]) => <div key={key}><dt>{fieldLabel(key)}</dt><dd>{value === null ? "—" : typeof value === "boolean" ? value ? "Yes" : "No" : String(value)}</dd></div>)}</dl>}</section><aside className="form-aside"><div className="aside-star">✳</div><h3>Record controls</h3><p>Changes here affect the live database.</p>{resource.canDelete && <><div className="aside-divider"/><CatalogDeleteButton resource={slug} id={id}/></>}</aside></div></>;
}
