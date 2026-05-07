'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  categorieen: { id: string; naam: string }[]
  leveranciers: { id: string; naam: string }[]
}

export default function NieuwProductForm({ categorieen, leveranciers }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form.entries())

    const res = await fetch('/api/producten', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      router.push('/producten')
      router.refresh()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Er ging iets mis')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {error && <div className="alert alert-red">✕ {error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label className="field-label">Productnaam *</label>
            <input className="input" name="naam" required placeholder="bijv. USB-C Kabel 2m" />
          </div>
          <div>
            <label className="field-label">SKU / artikelcode *</label>
            <input className="input" name="sku" required placeholder="bijv. EL-001" />
          </div>
        </div>

        <div>
          <label className="field-label">Omschrijving</label>
          <textarea className="input" name="omschrijving" rows={2} placeholder="Optionele omschrijving..." style={{ resize: 'vertical' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label className="field-label">Categorie *</label>
            <select className="input" name="categorieId" required>
              <option value="">— Kies categorie —</option>
              {categorieen.map(c => <option key={c.id} value={c.id}>{c.naam}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Leverancier</label>
            <select className="input" name="leverancierId">
              <option value="">— Geen —</option>
              {leveranciers.map(l => <option key={l.id} value={l.id}>{l.naam}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div>
            <label className="field-label">Inkoopprijs (€) *</label>
            <input className="input" name="inkoopprijs" type="number" step="0.01" min="0" required placeholder="0.00" />
          </div>
          <div>
            <label className="field-label">Verkoopprijs (€) *</label>
            <input className="input" name="verkoopprijs" type="number" step="0.01" min="0" required placeholder="0.00" />
          </div>
          <div>
            <label className="field-label">BTW (%)</label>
            <input className="input" name="btw" type="number" step="1" min="0" defaultValue="21" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div>
            <label className="field-label">Beginvoorraad</label>
            <input className="input" name="voorraadAantal" type="number" min="0" defaultValue="0" />
          </div>
          <div>
            <label className="field-label">Min. voorraad</label>
            <input className="input" name="minVoorraad" type="number" min="0" defaultValue="5" />
          </div>
          <div>
            <label className="field-label">Eenheid</label>
            <input className="input" name="eenheid" defaultValue="stuk" placeholder="stuk, kg, liter..." />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Opslaan...' : '✓ Product opslaan'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Annuleren</button>
        </div>
      </div>
    </form>
  )
}
