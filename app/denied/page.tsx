export default function DeniedPage() {
  return <main className="denied-page"><div className="cloud cloud-1" aria-hidden="true" /><div className="denied-card"><div className="denied-icon" aria-hidden="true">🔒</div><div className="eyebrow">ACCESS STATUS / 403</div><h1>LEVEL LOCKED</h1><p>This account cannot enter the control room yet. The Humor Project database must have the admin setup applied, and your existing Google profile must have <code>is_superadmin = true</code>. Your regular player account stays the same.</p><form action="/auth/signout" method="post"><button type="submit" className="solid-button">SIGN OUT / CHOOSE ACCOUNT ↗</button></form></div><div className="ground-strip" aria-hidden="true" /></main>;
}

