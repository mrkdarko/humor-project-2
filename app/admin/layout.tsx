import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "./nav";
import Link from "next/link";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user, profile } = await requireAdmin();
  const name = [profile.firstname, profile.lastname].filter(Boolean).join(" ") || user.email || "Administrator";
  return <div className="admin-shell">
    <div className="cloud cloud-1" aria-hidden="true" style={{ top: "115px", zIndex: 0 }} />
    <div className="cloud cloud-2" aria-hidden="true" style={{ top: "75%", zIndex: 0, animationDuration: "80s" }} />
    <div className="admin-frame">
      <header className="admin-header">
        <Link href="/admin" className="admin-brand"><span aria-hidden="true">🍄</span> HUMOR PROJECT</Link>
        <span className="admin-mode">🔑 ADMIN MODE</span>
        <div className="admin-account"><span>PLAYER: {name}</span><form action="/auth/signout" method="post"><button type="submit" className="signout-button">SIGN OUT</button></form></div>
      </header>
      <AdminNav />
      <main className="admin-main">{children}</main>
    </div>
    <div className="ground-strip" aria-hidden="true" />
  </div>;
}

