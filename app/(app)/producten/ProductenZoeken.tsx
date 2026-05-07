'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useTransition } from 'react'

interface Categorie { id: string; naam: string }

export default function ProductenZoeken({ categorieen, huidigZoek, huidigCat }: { categorieen: Categorie[]; huidigZoek: string; huidigCat: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  function update(q: string, cat: string) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (cat) params.set('cat', cat)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <input className="input" style={{ maxWidth: 280 }} defaultValue={huidigZoek} placeholder="Zoek op naam, SKU of barcode..."
        onChange={e => update(e.target.value, huidigCat)} />
      <select className="input" style={{ maxWidth: 180 }} value={huidigCat} onChange={e => update(huidigZoek, e.target.value)}>
        <option value="">Alle categorieën</option>
        {categorieen.map(c => <option key={c.id} value={c.id}>{c.naam}</option>)}
      </select>
      {(huidigZoek || huidigCat) && (
        <button className="btn btn-ghost" onClick={() => update('', '')}>✕ Wis filter</button>
      )}
    </div>
  )
}
