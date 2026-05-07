export const dynamic = 'force-dynamic'
import { prisma } from '@/app/lib/prisma'
import { formatEuro, formatDatum } from '@/app/lib/utils'
import Link from 'next/link'

export default async function VerkopenPage() {
  const verkopen = await prisma.verkoop.findMany({
    orderBy: { verkochtenOp: 'desc' },
    take: 50,
    include: {
      gebruiker: { select: { naam: true } },
      regels: {
        include: { product: { select: { naam: true } } }
      }
    }
  })

  const methodeBadge: Record<string, string> = {
    CONTANT: 'badge-green',
    PIN: 'badge-blue',
    FACTUUR: 'badge-amber',
    ONLINE: 'badge-purple',
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Verkopen</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>Laatste 50 transacties</p>
        </div>
        <Link href="/verkopen/nieuw">
          <button className="btn btn-primary">+ Verkoop registreren</button>
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="tabel">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Producten</th>
              <th>Medewerker</th>
              <th>Betaalmethode</th>
              <th style={{ textAlign: 'right' }}>Totaal</th>
            </tr>
          </thead>
          <tbody>
            {verkopen.map((v: typeof verkopen[number]) => (
              <tr key={v.id}>
                <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {formatDatum(v.verkochtenOp)}
                </td>
                <td>
                  <div style={{ fontSize: 12 }}>
                    {v.regels.slice(0, 2).map(r => r.product.naam).join(', ')}
                    {v.regels.length > 2 && <span style={{ color: 'var(--text-dim)' }}> +{v.regels.length - 2} meer</span>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{v.regels.length} regel{v.regels.length !== 1 ? 's' : ''}</div>
                </td>
                <td style={{ fontSize: 12 }}>{v.gebruiker.naam}</td>
                <td>
                  <span className={`badge ${methodeBadge[v.betalingsMethode] ?? 'badge-blue'}`}>
                    {v.betalingsMethode}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 500 }}>
                  {formatEuro(v.totaalBedrag)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
