import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getResource } from "@/lib/admin-catalog";
import { CatalogForm } from "../../catalog-form";

export default async function NewCatalogPage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource: slug } = await params;
  const { supabase } = await requireAdmin();
  const resource = getResource(slug);
  if (!resource?.canCreate) notFound();
  const providers = slug === "models" ? (await supabase.from("llm_providers").select("id, name").order("name")).data || [] : [];
  return <><div className="page-heading"><div><div className="eyebrow dark"><Link href={`/admin/catalog/${slug}`}>{resource.title}</Link> <span>●</span> NEW</div><h1>New {resource.title.toLowerCase()}<span className="heading-spark">✳</span></h1></div></div><section className="panel form-panel catalog-form-panel"><CatalogForm resource={resource} providers={providers}/></section></>;
}
