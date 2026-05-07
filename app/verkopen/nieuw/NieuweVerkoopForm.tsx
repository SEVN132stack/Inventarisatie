'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Product { id: string; naam: string; sku: string; barcode: string | null; verkoopprijs: string; btw: string; voorraadAantal: number; eenheid: string }
interface CartItem { product: Product; aantal: number }

export default function NieuweVerkoopForm({ producten }: { producten: Product[] }) {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [zoek, setZoek] = useState('')
  const [methode, setMethode] = useState('PIN')
  const [notitie, setNotitie] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verkoopId, setVerkoopId] = useState<string | null>(null)
  const [bonLoading, setBonLoading] = useState(false)
  const barcodeBuffer = useRef('')
  const barcodeTimer = useRef<NodeJS.Timeout | null>(null)
  const zoekRef = useRef<HTMLInputElement>(null)

  // Barcode scanner: luistert naar snelle toetsinvoer (scanner = razendsnel)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Negeer als we in een input zitten die niet de zoekbalk is
      const active = document.activeElement
      if (active && active !== zoekRef.current && active.tagName === 'INPUT') return

      if (e.key === 'Enter' && barcodeBuffer.current.length > 4) {
        const code = barcodeBuffer.current
        barcodeBuffer.current = ''
        if (barcodeTimer.current) clearTimeout(barcodeTimer.current)
        // Zoek op barcode of SKU
        const gevonden = producten.find(p => p.barcode === code || p.sku === code)
        if (gevonden) { voegToe(gevonden); setZoek('') }
        else { setZoek(code) }
        return
      }
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key
        if (barcodeTimer.current) clearTimeout(barcodeTimer.current)
        barcodeTimer.current = setTimeout(() => { barcodeBuffer.current = '' }, 100)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [producten])

  const gefilterd = zoek
    ? producten.filter(p => p.naam.toLowerCase().includes(zoek.toLowerCase()) || p.sku.toLowerCase().includes(zoek.toLowerCase()) || (p.barcode && p.barcode.includes(zoek))).slice(0, 8)
    : []

  function voegToe(product: Product) {
    setCart(c => {
      const bestaand = c.find(i => i.product.id === product.id)
      if (bestaand) return c.map(i => i.product.id === product.id ? { ...i, aantal: i.aantal + 1 } : i)
      return [...c, { product, aantal: 1 }]
    })
    setZoek('')
    zoekRef.current?.focus()
  }
  function verwijder(id: string) { setCart(c => c.filter(i => i.product.id !== id)) }
  function setAantal(id: string, aantal: number) {
    if (aantal <= 0) return verwijder(id)
    setCart(c => c.map(i => i.product.id === id ? { ...i, aantal } : i))
  }

  const totaal = cart.reduce((s, i) => s + Number(i.product.verkoopprijs) * i.aantal, 0)

  async function verwerk() {
    if (cart.length === 0) return
    setLoading(true); setError('')
    const res = await fetch('/api/verkopen', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ betalingsMethode: methode, notitie, regels: cart.map(i => ({ productId: i.product.id, aantal: i.aantal, eenheidsprijs: i.product.verkoopprijs, btw: i.product.btw })) })
    })
    setLoading(false)
    if (res.ok) {
      const d = await res.json()
      setVerkoopId(d.id)
      setCart([])
    } else {
      const d = await res.json(); setError(d.error ?? 'Fout')
    }
  }

  async function downloadBon() {
    if (!verkoopId) return
    setBonLoading(true)
    const res = await fetch(`/api/verkopen/${verkoopId}/bon`)
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `bon-${verkoopId.slice(-8)}.pdf`; a.click()
      URL.revokeObjectURL(url)
    }
    setBonLoading(false)
  }

  // Successcherm na verwerking
  if (verkoopId) {
    return (
      <div style={{ maxWidth: 400 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--green)', marginBottom: 8 }}>Verkoop verwerkt!</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Voorraad is automatisch bijgewerkt.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={downloadBon} disabled={bonLoading}>
              {bonLoading ? 'Laden...' : '🖨 Download verkoopbon (PDF)'}
            </button>
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setVerkoopId(null); router.refresh() }}>
              + Nieuwe verkoop
            </button>
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => router.push('/verkopen')}>
              Terug naar overzicht
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
      <div>
        {/* Zoekbalk met barcode hint */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label className="field-label" style={{ margin: 0 }}>Product zoeken of scan barcode</label>
            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>📷 Scanner werkt automatisch</span>
          </div>
          <input ref={zoekRef} className="input" value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Naam, SKU of barcode..." autoFocus />
          {zoek && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {gefilterd.length === 0
                ? <div style={{ color: 'var(--text-dim)', fontSize: 12, padding: '8px 0' }}>Geen producten gevonden</div>
                : gefilterd.map(p => (
                  <button key={p.id} className="btn btn-ghost" style={{ justifyContent: 'space-between', textAlign: 'left' }} onClick={() => voegToe(p)}>
                    <span><span style={{ fontWeight: 500 }}>{p.naam}</span><span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8, fontFamily: 'DM Mono, monospace' }}>{p.sku}</span></span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>€{Number(p.verkoopprijs).toFixed(2)}</span>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>Winkelwagen ({cart.length})</div>
          {cart.length === 0
            ? <div style={{ padding: 24, color: 'var(--text-dim)', fontSize: 13, textAlign: 'center' }}>Nog geen producten</div>
            : <table className="tabel">
                <thead><tr><th>Product</th><th style={{textAlign:'center'}}>Aantal</th><th style={{textAlign:'right'}}>Prijs</th><th style={{textAlign:'right'}}>Subtotaal</th><th></th></tr></thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.product.id}>
                      <td style={{ fontSize: 12, fontWeight: 500 }}>{item.product.naam}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 14 }} onClick={() => setAantal(item.product.id, item.aantal - 1)}>−</button>
                          <span style={{ fontFamily: 'DM Mono, monospace', minWidth: 20, textAlign: 'center' }}>{item.aantal}</span>
                          <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 14 }} onClick={() => setAantal(item.product.id, item.aantal + 1)}>+</button>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>€{Number(item.product.verkoopprijs).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 500 }}>€{(Number(item.product.verkoopprijs) * item.aantal).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}><button className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: 12, color: 'var(--red)' }} onClick={() => verwijder(item.product.id)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>}
        </div>
      </div>

      {/* Checkout */}
      <div>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: 14 }}>Betaling</div>
          <div style={{ marginBottom: 14 }}>
            <label className="field-label">Methode</label>
            <select className="input" value={methode} onChange={e => setMethode(e.target.value)}>
              <option value="PIN">PIN</option><option value="CONTANT">Contant</option><option value="FACTUUR">Factuur</option><option value="ONLINE">Online</option>
            </select>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="field-label">Notitie</label>
            <input className="input" value={notitie} onChange={e => setNotitie(e.target.value)} placeholder="Optioneel..." />
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 600 }}>
              <span>Totaal</span>
              <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--accent)' }}>€{totaal.toFixed(2)}</span>
            </div>
          </div>
          {error && <div className="alert alert-red" style={{ marginBottom: 12 }}>✕ {error}</div>}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 0', fontSize: 14 }} onClick={verwerk} disabled={cart.length === 0 || loading}>
            {loading ? 'Verwerken...' : '✓ Verwerk verkoop'}
          </button>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => router.back()}>Annuleren</button>
        </div>
      </div>
    </div>
  )
}
