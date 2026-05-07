export const dynamic = 'force-dynamic'
import { prisma } from './lib/prisma'
import { formatEuro, formatDatumKort } from './lib/utils'
import DashboardCharts from './components/ui/DashboardCharts'

async function getDashboardData() {
  const nu = new Date()
  const beginMaand = new Date(nu.getFullYear(), nu.getMonth(), 1)
  const beginVorigeMaand = new Date(nu.getFullYear(), nu.getMonth() - 1, 1)
  const eindeVorigeMaand = new Date(nu.getFullYear(), nu.getMonth(), 0)

  const [totaalProducten, verkopenDezeMaand, verkopenVorigeMaand, recenteVerkopen, topProducten] =
    await Promise.all([
      prisma.product.count({ where: { actief: true } }),
      prisma.verkoop.aggregate({
        where: { verkochtenOp: { gte: beginMaand } },
        _sum: { totaalBedrag: true }, _count: true,
      }),
      prisma.verkoop.aggregate({
        where: { verkochtenOp: { gte: beginVorigeMaand, lte: eindeVorigeMaand } },
        _sum: { totaalBedrag: true }, _count: true,
      }),
      prisma.verkoop.findMany({
        take: 6, orderBy: { verkochtenOp: 'desc' },
        include: { regels: { include: { product: { select: { naam: true } } } } },
      }),
      prisma.verkoopRegel.groupBy({
        by: ['productId'],
        _sum: { aantal: true, subtotaal: true },
        orderBy: { _sum: { subtotaal: 'desc' } },
        take: 5,
      }),
    ])

  // Raw SQL voor omzet per dag — gebruik Prisma-gegenereerde kolomnamen (snake_case)
  const verkopenPerDag = await prisma.$queryRaw<{ dag: string; omzet: number }[]>`
    SELECT DATE(verkocht_op)::text as dag, SUM(totaal_bedrag)::float as omzet
    FROM verkopen
    WHERE verkocht_op >= NOW() - INTERVAL '14 days'
    GROUP BY DATE(verkocht_op)
    ORDER BY dag ASC
  `

  const productIds = topProducten.map(t => t.productId)
  const productenNamen = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, naam: true },
  })

  const laagVoorraadProducten = await prisma.product.findMany({
    where: { actief: true },
    select: { naam: true, sku: true, voorraadAantal: true, minVoorraad: true },
    orderBy: { voorraadAantal: 'asc' },
    take: 10,
  })

  const omzetDezeMaand = Number(verkopenDezeMaand._sum.totaalBedrag ?? 0)
  const omzetVorig = Number(verkopenVorigeMaand._sum.totaalBedrag ?? 0)
  const omzetDelta = omzetVorig > 0
    ? Number(((omzetDezeMaand - omzetVorig) / omzetVorig * 100).toFixed(1))
    : 0

  return {
    totaalProducten,
    omzetDezeMaand,
    omzetDelta,
    aantalVerkopen: verkopenDezeMaand._count,
    recenteVerkopen,
    topProducten: topProducten.map(t => ({
      naam: productenNamen.find(p => p.id === t.productId)?.naam ?? '–',
      stuks: Number(t._sum.aantal ?? 0),
      omzet: Number(t._sum.subtotaal ?? 0),
    })),
    verkopenPerDag,
    laagVoorraadProducten: laagVoorraadProducten.filter(p => p.voorraadAantal <= p.minVoorraad),
  }
}

export default async function Dashboard() {
  let data
  try {
    data = await getDashboardData()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <div style={{ padding: 24 }}>
        <div style={{ background: 'var(--red-dim)', border: '1px solid #5a1a1a', borderRadius: 12, padding: 20 }}>
          <div style={{ color: 'var(--red)', fontWeight: 600, marginBottom: 8 }}>Database fout</div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--text-muted)' }}>{msg}</div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-dim)' }}>
            Controleer of de DATABASE_URL correct is ingesteld in je .env bestand.
          </div>
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Omzet deze maand', value: formatEuro(data.omzetDezeMaand), delta: data.omzetDelta, icon: '€' },
    { label: 'Verkopen (maand)', value: String(data.aantalVerkopen), delta: null, icon: '↗' },
    { label: 'Actieve producten', value: String(data.totaalProducten), delta: null, icon: '▦' },
    { label: 'Lage voorraad', value: String(data.laagVoorraadProducten.length), delta: null, icon: '⚠', alert: data.laagVoorraadProducten.length > 0 },
  ]

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
          {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} className="card" style={{ borderColor: s.alert ? 'var(--amber-dim)' : 'var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: s.alert ? 'var(--amber)' : 'var(--text)', fontFamily: 'DM Mono, monospace' }}>{s.value}</div>
                {s.delta !== null && (
                  <div className={s.delta >= 0 ? 'stat-delta-pos' : 'stat-delta-neg'} style={{ marginTop: 4 }}>
                    {s.delta >= 0 ? '▲' : '▼'} {Math.abs(s.delta)}% t.o.v. vorige maand
                  </div>
                )}
              </div>
              <div style={{ fontSize: 22, opacity: 0.2 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + lage voorraad */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: 16 }}>Omzet afgelopen 14 dagen</div>
          <DashboardCharts verkopenPerDag={data.verkopenPerDag} />
        </div>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: 16 }}>Lage voorraad</div>
          {data.laagVoorraadProducten.length === 0 ? (
            <div className="alert alert-green"><span>✓</span> Alle producten voldoende</div>
          ) : data.laagVoorraadProducten.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--amber-dim)', marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{p.naam}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'DM Mono, monospace' }}>{p.sku}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="badge badge-amber">{p.voorraadAantal}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>min {p.minVoorraad}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recente verkopen + top producten */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>Recente verkopen</div>
          <table className="tabel">
            <thead><tr><th>Product</th><th>Datum</th><th style={{ textAlign: 'right' }}>Bedrag</th></tr></thead>
            <tbody>
              {data.recenteVerkopen.map(v => (
                <tr key={v.id}>
                  <td style={{ fontSize: 12 }}>{v.regels[0]?.product?.naam ?? '–'}{v.regels.length > 1 ? ` +${v.regels.length - 1}` : ''}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>{formatDatumKort(v.verkochtenOp)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{formatEuro(v.totaalBedrag)}</td>
                </tr>
              ))}
              {data.recenteVerkopen.length === 0 && (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 12 }}>Nog geen verkopen</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>Top producten (omzet)</div>
          <table className="tabel">
            <thead><tr><th>Product</th><th style={{ textAlign: 'right' }}>Stuks</th><th style={{ textAlign: 'right' }}>Omzet</th></tr></thead>
            <tbody>
              {data.topProducten.map((t, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 12 }}>{t.naam}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>{t.stuks}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{formatEuro(t.omzet)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
