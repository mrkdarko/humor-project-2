"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Clapperboard, UsersRound, ThumbsUp, Gamepad2, UserRound, Images, GitBranch, ListOrdered, Shuffle, BookOpen, Sparkles, Cpu, Building2, MessageSquareText, Inbox, Globe, MailCheck } from "lucide-react";

const links = [
  { href: "/admin", label: "STATS", icon: BarChart3, group: "Community" },
  { href: "/admin/users", label: "PLAYERS", icon: UsersRound, group: "Community" },
  { href: "/admin/media", label: "AI MEDIA", icon: Clapperboard, group: "Community" },
  { href: "/admin/images", label: "IMAGES", icon: Images, group: "Community" },
  { href: "/admin/ratings", label: "VOTES", icon: ThumbsUp, group: "Community" },
  { href: "/admin/catalog/generation-requests", label: "REQUESTS", icon: Inbox, group: "AI workflow" },
  { href: "/admin/catalog/llm-responses", label: "RESPONSES", icon: MessageSquareText, group: "AI workflow" },
  { href: "/admin/catalog/prompt-chains", label: "CHAINS", icon: GitBranch, group: "AI workflow" },
  { href: "/admin/catalog/prompt-steps", label: "STEPS", icon: ListOrdered, group: "AI workflow" },
  { href: "/admin/catalog/prompt-mix", label: "CHAIN MIX", icon: Shuffle, group: "AI workflow" },
  { href: "/admin/catalog/terms", label: "TERMS", icon: BookOpen, group: "AI workflow" },
  { href: "/admin/catalog/examples", label: "EXAMPLES", icon: Sparkles, group: "AI workflow" },
  { href: "/admin/catalog/providers", label: "PROVIDERS", icon: Building2, group: "AI workflow" },
  { href: "/admin/catalog/models", label: "MODELS", icon: Cpu, group: "AI workflow" },
  { href: "/admin/catalog/signup-domains", label: "DOMAINS", icon: Globe, group: "Signup lists" },
  { href: "/admin/catalog/email-allowlist", label: "EMAILS", icon: MailCheck, group: "Signup lists" },
  { href: "/admin/play", label: "PLAY", icon: Gamepad2, group: "My account" },
  { href: "/admin/profile", label: "MY PROFILE", icon: UserRound, group: "My account" },
];

export function AdminNav() {
  const path = usePathname();
  return <nav className="side-nav" aria-label="Admin navigation">
    {["Community", "AI workflow", "Signup lists", "My account"].map(group => <div key={group} className="nav-group"><span className="nav-group-label">{group}</span><div>{links.filter(link => link.group === group).map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={path === href || (href !== "/admin" && path.startsWith(`${href}/`)) ? "page" : undefined} className={`nav-link ${path === href || (href !== "/admin" && path.startsWith(`${href}/`)) ? "active" : ""}`}><Icon size={18} strokeWidth={2.5} /><span>{label}</span></Link>)}</div></div>)}
  </nav>;
}

