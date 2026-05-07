'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Categorie { id: string; naam: string; omschrijving: string | null; _count: { producten: number } }

export default function CategorieenBeheer({ categorieen }: { categorieen: Categorie[] }) {
  const router = useRouter()
  const [naam, setNaam] = useState(''); const [omschrijving, setOmschrijving] = useState('')
  const [bewerkId, setBewerkId] = useState<string|null>(null); const [bewerkNaam, setBewerkNaam] = useState('')
  const [loading, setLoading] = useState(false)

  async function voegToe() {
    if (!naam) return; setLoading(true)
    await fetch('/api/beheer/categorieen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ naam, omschrijving }) })
    setNaam(''); setOmschrijving(''); setLoading(false); router.refresh()
  }
  async function slaOp(id: string) {
    await fetch(`/api/beheer/categorieen/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ naam: bewerkNaam }) })
    setBewerkId(null); router.refresh()
  }
  async function verwijder(id: string) {
    if (!confirm('Categorie verwijderen?')) return
    await fetch(`/api/beheer/categorieen/${id}`, { method: 'DELETE' }); router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>Categorieën ({categorieen.length})</div>
        <table className="tabel">
          <thead><tr><th>Naam</th><th>Omschrijving</th><th style={{textAlign:'right'}}>Producten</th><th></th></tr></thead>
          <tbody>
            {categorieen.map(c => (
              <tr key={c.id}>
                <td>{bewerkId === c.id ? <input className="input" value={bewerkNaam} onChange={e => setBewerkNaam(e.target.value)} style={{ padding: '4px 8px', fontSize: 12 }} /> : <span style={{ fontWeight: 500, fontSize: 13 }}>{c.naam}</span>}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.omschrijving ?? '–'}</td>
                <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{c._count.producten}</td>
                <td style={{ textAlign: 'right' }}>
                  {bewerkId === c.id
                    ? <><button className="btn btn-primary" style={{ padding: '3px 10px', fontSize: 11, marginRight: 6 }} onClick={() => slaOp(c.id)}>✓</button><button className="btn btn-ghost" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => setBewerkId(null)}>✕</button></>
                    : <><button className="btn btn-ghost" style={{ padding: '3px 10px', fontSize: 11, marginRight: 6 }} onClick={() => { setBewerkId(c.id); setBewerkNaam(c.naam) }}>✎</button>
                       {c._count.producten === 0 && <button className="btn btn-danger" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => verwijder(c.id)}>✕</button>}</>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Nieuwe categorie</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label className="field-label">Naam *</label><input className="input" value={naam} onChange={e => setNaam(e.target.value)} placeholder="bijv. Elektronica" /></div>
          <div><label className="field-label">Omschrijving</label><input className="input" value={omschrijving} onChange={e => setOmschrijving(e.target.value)} placeholder="Optioneel" /></div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={voegToe} disabled={loading || !naam}>{loading ? '...' : '+ Toevoegen'}</button>
      </div>
    </div>
  )
}
