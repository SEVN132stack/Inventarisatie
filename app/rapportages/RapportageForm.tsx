'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RapportageForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [type, setType] = useState('MAANDELIJKS')

  const now = new Date()
  const defaultStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
  const defaultEinde = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)

  const [start, setStart] = useState(defaultStart)
  const [einde, setEinde] = useState(defaultEinde)
  const [stuurMail, setStuurMail] = useState(true)

  async function genereer() {
    setLoading(true); setSuccess(false)
    const res = await fetch('/api/rapportages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, periodeStart: start, periodeEinde: einde, stuurMail }),
    })
    setLoading(false)
    if (res.ok) { setSuccess(true); router.refresh() }
  }

  return (
    <div className="card">
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: 14 }}>
        Rapportage genereren
      </div>

      {success && <div className="alert alert-green" style={{ marginBottom: 12 }}>✓ Rapportage aangemaakt</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label className="field-label">Type</label>
          <select className="input" value={type} onChange={e => setType(e.target.value)}>
            <option value="MAANDELIJKS">Maandelijks</option>
            <option value="KWARTAAL">Kwartaal</option>
            <option value="JAARLIJKS">Jaarlijks</option>
            <option value="HANDMATIG">Aangepaste periode</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label className="field-label">Van</label>
            <input className="input" type="date" value={start} onChange={e => setStart(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Tot</label>
            <input className="input" type="date" value={einde} onChange={e => setEinde(e.target.value)} />
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}>
          <input type="checkbox" checked={stuurMail} onChange={e => setStuurMail(e.target.checked)} />
          Verstuur automatisch per e-mail
        </label>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={genereer} disabled={loading}>
          {loading ? 'Bezig...' : '◉ Genereer rapportage'}
        </button>
      </div>
    </div>
  )
}
