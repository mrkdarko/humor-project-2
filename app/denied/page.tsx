import Link from "next/link";
export default function DeniedPage() {
  return <main className="denied-page"><div className="cloud cloud-1" aria-hidden="true" /><div className="denied-card"><div className="denied-icon" aria-hidden="true">🔒</div><div className="eyebrow">ACCESS STATUS / 403</div><h1>LEVEL LOCKED</h1><p>Your Google account is signed in, but its profile has not been granted superadmin access.</p><Link href="/" className="solid-button">BACK TO SIGN IN ↗</Link></div><div className="ground-strip" aria-hidden="true" /></main>;
}

