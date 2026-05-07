export const dynamic = 'force-dynamic'
import { prisma } from '../lib/prisma'
import { formatEuro } from '../lib/utils'
import Link from 'next/link'
import ProductenZoeken from './ProductenZoeken'

export default async function ProductenPage({ searchParams }: { searchParams: { q?: string; cat?: string } }) {
  const zoekterm = searchParams.q ?? ''
  const catFilter = searchParams.cat ?? ''

  const [producten, categorieen] = await Promise.all([
    prisma.product.findMany({
      where: {
        actief: true,
        ...(zoekterm ? { OR: [
          { naam: { contains: zoekterm, mode: 'insensitive' } },
          { sku: { contains: zoekterm, mode: 'insensitive' } },
          { barcode: { contains: zoekterm, mode: 'insensitive' } },
        ]} : {}),
        ...(catFilter ? { categorieId: catFilter } : {}),
      },
      include: { categorie: true, leverancier: true },
      orderBy: { naam: 'asc' },
    }),
    prisma.categorie.findMany({ orderBy: { naam: 'asc' } }),
  ])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Producten</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>{producten.length} product{producten.length !== 1 ? 'en' : ''}</p>
        </div>
        <Link href="/producten/nieuw"><button className="btn btn-primary">+ Nieuw product</button></Link>
      </div>

      <ProductenZoeken categorieen={categorieen} huidigZoek={zoekterm} huidigCat={catFilter} />

      <div className="card" style={{ padding: 0 }}>
        <table className="tabel">
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Categorie</th><th style={{textAlign:'right'}}>Inkoop</th><th style={{textAlign:'right'}}>Verkoop</th><th style={{textAlign:'center'}}>Voorraad</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {producten.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 24 }}>Geen producten gevonden</td></tr>}
            {producten.map(p => {
              const laag = p.voorraadAantal <= p.minVoorraad
              const marge = ((Number(p.verkoopprijs) - Number(p.inkoopprijs)) / Number(p.verkoopprijs) * 100).toFixed(0)
              return (
                <tr key={p.id}>
                  <td><div style={{ fontWeight: 500, fontSize: 13 }}>{p.naam}</div>{p.leverancier && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{p.leverancier.naam}</div>}</td>
                  <td><span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>{p.sku}</span></td>
                  <td><span className="badge badge-purple">{p.categorie.naam}</span></td>
                  <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{formatEuro(p.inkoopprijs)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{formatEuro(p.verkoopprijs)}</div>
                    <div style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'DM Mono, monospace' }}>{marge}% marge</div>
                  </td>
                  <td style={{ textAlign: 'center' }}><span className={`badge ${laag ? 'badge-amber' : 'badge-green'}`}>{p.voorraadAantal} {p.eenheid}</span></td>
                  <td>{laag ? <span className="badge badge-amber">⚠ Laag</span> : <span className="badge badge-green">✓ OK</span>}</td>
                  <td style={{ textAlign: 'right' }}><Link href={`/producten/${p.id}/bewerken`}><button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: 12 }}>✎ Bewerk</button></Link></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
