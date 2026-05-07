'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Product { id: string; naam: string; sku: string; voorraadAantal: number; eenheid: string }

export default function AanvullingModal({ producten }: { producten: Product[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [productId, setProductId] = useState('')
  const [aantal, setAantal] = useState(1)
  const [notitie, setNotitie] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const geselecteerd = producten.find(p => p.id === productId)

  async function registreer() {
    if (!productId || aantal < 1) return
    setLoading(true)
    const res = await fetch('/api/voorraad/aanvulling', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, aantal, notitie }),
    })
    setLoading(false)
    if (res.ok) {
      const d = await res.json()
      setSuccess(`✓ ${d.product?.naam} aangevuld — nieuw totaal: ${d.product?.voorraadAantal}`)
      setProductId(''); setAantal(1); setNotitie('')
      router.refresh()
      setTimeout(() => { setSuccess(''); setOpen(false) }, 2500)
    }
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Aanvulling registreren</button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 420, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Aanvulling registreren</div>
              <button className="btn btn-ghost" style={{ padding: '2px 8px' }} onClick={() => setOpen(false)}>✕</button>
            </div>

            {success && <div className="alert alert-green" style={{ marginBottom: 14 }}>{success}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="field-label">Product *</label>
                <select className="input" value={productId} onChange={e => setProductId(e.target.value)}>
                  <option value="">— Kies product —</option>
                  {producten.map(p => (
                    <option key={p.id} value={p.id}>{p.naam} ({p.sku}) — huidig: {p.voorraadAantal} {p.eenheid}</option>
                  ))}
                </select>
              </div>

              {geselecteerd && (
                <div style={{ display: 'flex', gap: 8, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8, fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Huidige voorraad:</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 600, color: geselecteerd.voorraadAantal <= 5 ? 'var(--amber)' : 'var(--green)' }}>
                    {geselecteerd.voorraadAantal} {geselecteerd.eenheid}
                  </span>
                </div>
              )}

              <div>
                <label className="field-label">Aantal toe te voegen *</label>
                <input className="input" type="number" min="1" value={aantal} onChange={e => setAantal(parseInt(e.target.value) || 1)} />
              </div>

              <div>
                <label className="field-label">Notitie</label>
                <input className="input" value={notitie} onChange={e => setNotitie(e.target.value)} placeholder="bijv. Levering week 21" />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={registreer} disabled={loading || !productId}>
                  {loading ? 'Registreren...' : `+ ${aantal} toevoegen`}
                </button>
                <button className="btn btn-ghost" onClick={() => setOpen(false)}>Annuleren</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
