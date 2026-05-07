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
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

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

  async function toggleActief(id: string, huidigActief: boolean) {
    setToggling(id)
    await fetch(`/api/instellingen/email/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actief: !huidigActief }),
    })
    setToggling(null)
    router.refresh()
  }

  async function verwijder(id: string) {
    setDeleting(id)
    await fetch(`/api/instellingen/email/${id}`, { method: 'DELETE' })
    setDeleting(null)
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Ontvangers lijst met checkboxes */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: 6 }}>
          Maandelijkse rapportage ontvangers
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Vink aan wie de automatische maandrapportage ontvangt.
        </div>

        {emailInstellingen.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontSize: 13, padding: '12px 0' }}>Nog geen ontvangers. Voeg er hieronder een toe.</div>
        ) : emailInstellingen.map(e => (
          <div key={e.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', background: 'var(--bg3)',
            borderRadius: 8, marginBottom: 8,
            border: `1px solid ${e.actief ? 'var(--accent-dim)' : 'var(--border)'}`,
            opacity: toggling === e.id ? 0.6 : 1,
            transition: 'all 0.15s',
          }}>
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={e.actief}
              onChange={() => toggleActief(e.id, e.actief)}
              disabled={toggling === e.id}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)' }}
            />

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: e.actief ? 'var(--text)' : 'var(--text-muted)' }}>
                {e.ontvangerNaam ?? e.ontvangerEmail}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                {e.ontvangerNaam ? e.ontvangerEmail + ' · ' : ''}dag {e.verzendDag} van de maand
              </div>
            </div>

            {/* Status badge */}
            <span className={`badge ${e.actief ? 'badge-green' : 'badge-red'}`}>
              {e.actief ? '✓ Actief' : '✕ Inactief'}
            </span>

            {/* Verwijder */}
            <button
              className="btn btn-ghost"
              style={{ padding: '3px 8px', fontSize: 11, color: 'var(--red)' }}
              onClick={() => verwijder(e.id)}
              disabled={deleting === e.id}
            >
              {deleting === e.id ? '...' : '✕'}
            </button>
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

      {/* Env variabelen info */}
      <div className="card" style={{ borderColor: 'var(--accent-dim)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: 12 }}>
          Vereiste omgevingsvariabelen
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { key: 'BREVO_SMTP_USER', desc: 'Brevo account e-mailadres' },
            { key: 'BREVO_SMTP_KEY', desc: 'SMTP sleutel (xsmtpsib-...)' },
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
