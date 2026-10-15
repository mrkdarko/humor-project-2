"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Clapperboard, UsersRound, ThumbsUp } from "lucide-react";

const links = [
  { href: "/admin", label: "STATS", icon: BarChart3 },
  { href: "/admin/users", label: "PLAYERS", icon: UsersRound },
  { href: "/admin/media", label: "AI MEDIA", icon: Clapperboard },
  { href: "/admin/ratings", label: "VOTES", icon: ThumbsUp },
];

export function AdminNav() {
  const path = usePathname();
  return <nav className="side-nav" aria-label="Admin navigation">
    {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={path === href || (href !== "/admin" && path.startsWith(`${href}/`)) ? "page" : undefined} className={`nav-link ${path === href || (href !== "/admin" && path.startsWith(`${href}/`)) ? "active" : ""}`}><Icon size={18} strokeWidth={2.5} /><span>{label}</span></Link>)}
  </nav>;
}

