'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EmailInstelling {
  id: string; ontvangerEmail: string; ontvangerNaam: string | null; verzendDag: number; actief: boolean
}

export default function InstellingenForm({ emailInstellingen }: { emailInstellingen: EmailInstelling[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')
  const [naam, setNaam] = useState('')
  const [dag, setDag] = useState(1)

  async function voegToe() {
    if (!email) return
    setLoading(true)
    const res = await fetch('/api/instellingen/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ontvangerEmail: email, ontvangerNaam: naam || null, verzendDag: dag }),
    })
    setLoading(false)
    if (res.ok) { setSuccess(true); setEmail(''); setNaam(''); router.refresh() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Bestaande ontvangers */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: 16 }}>
          E-mail ontvangers
        </div>

        {emailInstellingen.length === 0
          ? <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Nog geen ontvangers toegevoegd.</div>
          : emailInstellingen.map(e => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8, marginBottom: 8, border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{e.ontvangerNaam ?? e.ontvangerEmail}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{e.ontvangerEmail} · Verzenden op dag {e.verzendDag}</div>
                </div>
                <span className={`badge ${e.actief ? 'badge-green' : 'badge-red'}`}>{e.actief ? 'Actief' : 'Inactief'}</span>
              </div>
            ))}
      </div>

      {/* Nieuwe ontvanger */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: 16 }}>
          Ontvanger toevoegen
        </div>

        {success && <div className="alert alert-green" style={{ marginBottom: 14 }}>✓ Ontvanger toegevoegd</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="field-label">E-mailadres *</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="eigenaar@winkel.nl" />
          </div>
          <div>
            <label className="field-label">Naam</label>
            <input className="input" value={naam} onChange={e => setNaam(e.target.value)} placeholder="Eigenaar" />
          </div>
          <div>
            <label className="field-label">Verzenddag van de maand (1–28)</label>
            <input className="input" type="number" min={1} max={28} value={dag} onChange={e => setDag(parseInt(e.target.value))} />
          </div>
          <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={voegToe} disabled={loading || !email}>
            {loading ? 'Opslaan...' : '+ Ontvanger toevoegen'}
          </button>
        </div>
      </div>

      {/* Environment info */}
      <div className="card" style={{ borderColor: 'var(--accent-dim)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: 12 }}>
          Vereiste omgevingsvariabelen
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { key: 'DATABASE_URL', desc: 'PostgreSQL connectiestring' },
            { key: 'BREVO_API_KEY', desc: 'API sleutel van app.brevo.com' },
            { key: 'EMAIL_FROM', desc: 'Afzenderadres (bijv. noreply@winkel.nl)' },
            { key: 'EMAIL_NAAM', desc: 'Afzendernaam (bijv. WinkelPro)' },
          ].map(({ key, desc }) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg3)', borderRadius: 6 }}>
              <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--accent)' }}>{key}</code>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
