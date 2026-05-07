'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Lev { id: string; naam: string; contactpersoon: string|null; email: string|null; telefoon: string|null; website: string|null; _count: { producten: number } }

export default function LeveranciersBeheer({ leveranciers }: { leveranciers: Lev[] }) {
  const router = useRouter()
  const [form, setForm] = useState({ naam: '', contactpersoon: '', email: '', telefoon: '', website: '' })
  const [loading, setLoading] = useState(false)

  async function voegToe() {
    if (!form.naam) return; setLoading(true)
    await fetch('/api/beheer/leveranciers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setForm({ naam: '', contactpersoon: '', email: '', telefoon: '', website: '' }); setLoading(false); router.refresh()
  }
  async function verwijder(id: string) {
    if (!confirm('Leverancier verwijderen?')) return
    await fetch(`/api/beheer/leveranciers/${id}`, { method: 'DELETE' }); router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>Leveranciers ({leveranciers.length})</div>
        <table className="tabel">
          <thead><tr><th>Naam</th><th>Contact</th><th>E-mail</th><th>Telefoon</th><th style={{textAlign:'right'}}>Producten</th><th></th></tr></thead>
          <tbody>
            {leveranciers.map(l => (
              <tr key={l.id}>
                <td style={{ fontWeight: 500, fontSize: 13 }}>{l.naam}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.contactpersoon ?? '–'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.email ?? '–'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.telefoon ?? '–'}</td>
                <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{l._count.producten}</td>
                <td style={{ textAlign: 'right' }}>
                  {l._count.producten === 0 && <button className="btn btn-danger" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => verwijder(l.id)}>✕</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Nieuwe leverancier</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {([['naam','Naam *','bijv. Groothandel BV'],['contactpersoon','Contactpersoon',''],['email','E-mail','info@leverancier.nl'],['telefoon','Telefoon',''],['website','Website','https://']] as [keyof typeof form, string, string][]).map(([k,l,p]) => (
            <div key={k}><label className="field-label">{l}</label><input className="input" value={form[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))} placeholder={p} /></div>
          ))}
        </div>
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={voegToe} disabled={loading || !form.naam}>{loading ? '...' : '+ Toevoegen'}</button>
      </div>
    </div>
  )
}
