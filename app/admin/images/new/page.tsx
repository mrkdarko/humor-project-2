import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ImageForm } from "../image-form";

export default async function NewImagePage() {
  const { user } = await requireAdmin();
  return <><div className="page-heading"><div><div className="eyebrow dark"><Link href="/admin/images">IMAGES</Link> <span>●</span> NEW</div><h1>Upload image<span className="heading-spark">✳</span></h1></div></div><ImageForm userId={user.id}/></>;
}
