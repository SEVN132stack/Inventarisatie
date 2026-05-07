'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EmailInstelling {
  id: string; ontvangerEmail: string; ontvangerNaam: string | null; verzendDag: number; actief: boolean
}

interface Props {
  emailInstellingen: EmailInstelling[]
}

export default function RapportageForm({ emailInstellingen }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState<'excel' | 'pdf' | null>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState('MAANDELIJKS')
  const [stuurMail, setStuurMail] = useState(true)

  const now = new Date()
  const defaultStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
  const defaultEinde = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)
  const [start, setStart] = useState(defaultStart)
  const [einde, setEinde] = useState(defaultEinde)

  const actieveOntvangers = emailInstellingen.filter(e => e.actief).length

  async function genereer() {
    setLoading(true); setSuccess(false); setError('')
    const res = await fetch('/api/rapportages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, periodeStart: start, periodeEinde: einde, stuurMail }),
    })
    setLoading(false)
    if (res.ok) { setSuccess(true); router.refresh() }
    else { const d = await res.json(); setError(d.error ?? 'Fout') }
  }

  async function download(format: 'excel' | 'pdf') {
    setDownloadLoading(format); setError('')
    try {
      const res = await fetch(`/api/rapportages/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodeStart: start, periodeEinde: einde }),
      })
      if (!res.ok) { setError(`Download mislukt`); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rapportage-${start}-${einde}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError('Download mislukt')
    } finally {
      setDownloadLoading(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Periode & type */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: 14 }}>
          Rapportage aanmaken
        </div>

        {success && <div className="alert alert-green" style={{ marginBottom: 12 }}>✓ Rapportage aangemaakt{stuurMail && actieveOntvangers > 0 ? ` en verstuurd naar ${actieveOntvangers} ontvanger(s)` : ''}</div>}
        {error && <div className="alert alert-red" style={{ marginBottom: 12 }}>✕ {error}</div>}

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

          {emailInstellingen.length > 0 && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}>
              <input type="checkbox" checked={stuurMail} onChange={e => setStuurMail(e.target.checked)} />
              Verstuur per e-mail ({actieveOntvangers} actieve ontvanger{actieveOntvangers !== 1 ? 's' : ''})
            </label>
          )}

          {/* Actie knoppen */}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={genereer} disabled={loading}>
            {loading ? 'Bezig...' : '◉ Genereer & sla op'}
          </button>

          {/* Download knoppen */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              className="btn btn-ghost"
              style={{ justifyContent: 'center', gap: 6 }}
              onClick={() => download('excel')}
              disabled={downloadLoading !== null}
            >
              {downloadLoading === 'excel' ? '...' : '⬇ Excel (.xlsx)'}
            </button>
            <button
              className="btn btn-ghost"
              style={{ justifyContent: 'center', gap: 6 }}
              onClick={() => download('pdf')}
              disabled={downloadLoading !== null}
            >
              {downloadLoading === 'pdf' ? '...' : '⬇ PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
