import { prisma } from '../lib/prisma'
import { formatEuro } from '../lib/utils'
import Link from 'next/link'

export default async function ProductenPage() {
  const producten = await prisma.product.findMany({
    where: { actief: true },
    include: { categorie: true, leverancier: true },
    orderBy: { naam: 'asc' },
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Producten</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>{producten.length} actieve producten</p>
        </div>
        <Link href="/producten/nieuw">
          <button className="btn btn-primary">+ Nieuw product</button>
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="tabel">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Categorie</th>
              <th style={{ textAlign: 'right' }}>Inkoop</th>
              <th style={{ textAlign: 'right' }}>Verkoop</th>
              <th style={{ textAlign: 'center' }}>Voorraad</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {producten.map((p) => {
              const laag = p.voorraadAantal <= p.minVoorraad
              const marge = ((Number(p.verkoopprijs) - Number(p.inkoopprijs)) / Number(p.verkoopprijs) * 100).toFixed(0)
              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{p.naam}</div>
                    {p.leverancier && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{p.leverancier.naam}</div>}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>{p.sku}</span>
                  </td>
                  <td>
                    <span className="badge badge-purple">{p.categorie.naam}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
                    {formatEuro(p.inkoopprijs)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{formatEuro(p.verkoopprijs)}</div>
                    <div style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'DM Mono, monospace' }}>{marge}% marge</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${laag ? 'badge-amber' : 'badge-green'}`}>
                      {p.voorraadAantal} {p.eenheid}
                    </span>
                  </td>
                  <td>
                    {laag
                      ? <span className="badge badge-amber">⚠ Laag</span>
                      : <span className="badge badge-green">✓ OK</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
