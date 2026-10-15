import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { MediaForm } from "../media-form";

export default async function NewMediaPage() {
  await requireAdmin();
  return <><div className="page-heading"><div><div className="eyebrow dark"><Link href="/admin/media">AI MEDIA</Link> <span>●</span> NEW ENTRY</div><h1>Create media<span className="heading-spark">✳</span></h1><p>Add a new AI generated caption to the community library.</p></div></div><div className="form-layout"><section className="panel form-panel"><div className="form-panel-heading"><span className="step-number">01</span><div><h2>Media details</h2><p>Every field helps keep the creative record clear.</p></div></div><MediaForm mode="create"/></section><aside className="form-aside"><div className="aside-star">✳</div><h3>Behind every laugh is a good prompt.</h3><p>Choose the original creator’s profile, record the prompt and AI provider, then publish the finished caption.</p><Link href="/admin/users">Find a profile ID ↗</Link></aside></div></>;
}

