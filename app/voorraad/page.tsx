import { prisma } from '../lib/prisma'
import { formatDatum } from '../lib/utils'

export default async function VoorraadPage() {
  const [producten, mutaties] = await Promise.all([
    prisma.product.findMany({
      where: { actief: true },
      include: { categorie: true },
      orderBy: { voorraadAantal: 'asc' },
    }),
    prisma.voorraadMutatie.findMany({
      take: 30,
      orderBy: { gemuteerddOp: 'desc' },
      include: {
        product: { select: { naam: true, sku: true } },
        gebruiker: { select: { naam: true } },
      }
    })
  ])

  const redenLabel: Record<string, string> = {
    VERKOOP: 'Verkoop',
    AANVULLING: 'Aanvulling',
    CORRECTIE: 'Correctie',
    RETOUR: 'Retour',
    AFSCHRIJVING: 'Afschrijving',
    INVENTARISATIE: 'Inventarisatie',
  }

  const redenBadge: Record<string, string> = {
    VERKOOP: 'badge-blue',
    AANVULLING: 'badge-green',
    CORRECTIE: 'badge-amber',
    RETOUR: 'badge-purple',
    AFSCHRIJVING: 'badge-red',
    INVENTARISATIE: 'badge-amber',
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Voorraad</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>Actuele voorraadstatus en mutatielog</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Voorraad overzicht */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>Voorraadstatus</div>
          </div>
          <table className="tabel">
            <thead>
              <tr>
                <th>Product</th>
                <th style={{ textAlign: 'right' }}>Aantal</th>
                <th style={{ textAlign: 'right' }}>Min.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {producten.map(p => {
                const laag = p.voorraadAantal <= p.minVoorraad
                const kritiek = p.voorraadAantal === 0
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{p.naam}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'DM Mono, monospace' }}>{p.sku}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 600, color: kritiek ? 'var(--red)' : laag ? 'var(--amber)' : 'var(--green)' }}>
                      {p.voorraadAantal}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--text-dim)' }}>{p.minVoorraad}</td>
                    <td>
                      {kritiek
                        ? <span className="badge badge-red">✕ Leeg</span>
                        : laag
                          ? <span className="badge badge-amber">⚠ Laag</span>
                          : <span className="badge badge-green">✓ OK</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mutatielog */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>Mutatielog (laatste 30)</div>
          </div>
          <table className="tabel">
            <thead>
              <tr>
                <th>Product</th>
                <th>Reden</th>
                <th style={{ textAlign: 'right' }}>Delta</th>
                <th>Datum</th>
              </tr>
            </thead>
            <tbody>
              {mutaties.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ fontSize: 12 }}>{m.product.naam}</div>
                  </td>
                  <td><span className={`badge ${redenBadge[m.redenType] ?? 'badge-blue'}`}>{redenLabel[m.redenType]}</span></td>
                  <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 600, color: m.delta > 0 ? 'var(--green)' : 'var(--red)' }}>
                    {m.delta > 0 ? '+' : ''}{m.delta}
                  </td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                    {formatDatum(m.gemuteerddOp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
