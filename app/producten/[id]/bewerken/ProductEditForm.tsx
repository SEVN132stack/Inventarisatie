'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string; naam: string; sku: string; omschrijving: string | null
  categorieId: string; leverancierId: string | null
  inkoopprijs: any; verkoopprijs: any; btw: any
  voorraadAantal: number; minVoorraad: number; eenheid: string
}

interface Props {
  product: Product
  categorieen: { id: string; naam: string }[]
  leveranciers: { id: string; naam: string }[]
}

export default function ProductEditForm({ product, categorieen, leveranciers }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [bevestigVerwijder, setBevestigVerwijder] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setError('')
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form.entries())
    const res = await fetch(`/api/producten/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) { router.push('/producten'); router.refresh() }
    else { const d = await res.json(); setError(d.error ?? 'Fout'); setLoading(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/producten/${product.id}`, { method: 'DELETE' })
    if (res.ok) { router.push('/producten'); router.refresh() }
    else { setError('Verwijderen mislukt'); setDeleting(false) }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {error && <div className="alert alert-red">✕ {error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label className="field-label">Productnaam *</label>
            <input className="input" name="naam" required defaultValue={product.naam} />
          </div>
          <div>
            <label className="field-label">SKU *</label>
            <input className="input" name="sku" required defaultValue={product.sku} />
          </div>
        </div>

        <div>
          <label className="field-label">Omschrijving</label>
          <textarea className="input" name="omschrijving" rows={2} defaultValue={product.omschrijving ?? ''} style={{ resize: 'vertical' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label className="field-label">Categorie *</label>
            <select className="input" name="categorieId" required defaultValue={product.categorieId}>
              {categorieen.map(c => <option key={c.id} value={c.id}>{c.naam}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Leverancier</label>
            <select className="input" name="leverancierId" defaultValue={product.leverancierId ?? ''}>
              <option value="">— Geen —</option>
              {leveranciers.map(l => <option key={l.id} value={l.id}>{l.naam}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div>
            <label className="field-label">Inkoopprijs (€) *</label>
            <input className="input" name="inkoopprijs" type="number" step="0.01" min="0" required defaultValue={Number(product.inkoopprijs).toFixed(2)} />
          </div>
          <div>
            <label className="field-label">Verkoopprijs (€) *</label>
            <input className="input" name="verkoopprijs" type="number" step="0.01" min="0" required defaultValue={Number(product.verkoopprijs).toFixed(2)} />
          </div>
          <div>
            <label className="field-label">BTW (%)</label>
            <input className="input" name="btw" type="number" step="1" min="0" defaultValue={Number(product.btw)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label className="field-label">Min. voorraad</label>
            <input className="input" name="minVoorraad" type="number" min="0" defaultValue={product.minVoorraad} />
          </div>
          <div>
            <label className="field-label">Eenheid</label>
            <input className="input" name="eenheid" defaultValue={product.eenheid} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Opslaan...' : '✓ Wijzigingen opslaan'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Annuleren</button>
          </div>

          {/* Verwijder sectie */}
          {!bevestigVerwijder ? (
            <button type="button" className="btn btn-danger" onClick={() => setBevestigVerwijder(true)}>
              Verwijder product
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Weet je het zeker?</span>
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Verwijderen...' : 'Ja, verwijder'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setBevestigVerwijder(false)}>Nee</button>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}
