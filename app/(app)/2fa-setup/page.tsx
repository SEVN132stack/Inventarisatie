export const dynamic = 'force-dynamic'
import TwofaSetup from './TwofaSetup'

export default function TwofaSetupPage() {
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', paddingTop: 20 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>🔐 Tweestapsverificatie instellen</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 13 }}>
          Beveilig je account met een extra verificatiestap. Dit is verplicht voor alle gebruikers.
        </p>
      </div>
      <TwofaSetup />
    </div>
  )
}
