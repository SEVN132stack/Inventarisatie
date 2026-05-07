export const dynamic = 'force-dynamic'
import { prisma } from './lib/prisma'
import { formatEuro, formatDatumKort } from './lib/utils'
import DashboardCharts from './components/ui/DashboardCharts'
import { unstable_cache } from 'next/cache'

// Cache productencount voor 5 minuten (verandert zelden)
const getCachedProductCount = unstable_cache(
  async () => prisma.product.count({ where: { actief: true } }),
  ['product-count'], { revalidate: 300 }
)

async function getDashboardData() {
  const nu = new Date()
  const beginMaand = new Date(nu.getFullYear(), nu.getMonth(), 1)
  const beginVorigeMaand = new Date(nu.getFullYear(), nu.getMonth() - 1, 1)
  const eindeVorigeMaand = new Date(nu.getFullYear(), nu.getMonth(), 0)
  const veertiendagenGeleden = new Date(nu); veertiendagenGeleden.setDate(nu.getDate() - 14)

  const [totaalProducten, verkopenDezeMaand, verkopenVorigeMaand, recenteVerkopen, topProducten, verkopenPerMethodeRaw] = await Promise.all([
    getCachedProductCount(),
    prisma.verkoop.aggregate({ where: { verkochtenOp: { gte: beginMaand } }, _sum: { totaalBedrag: true }, _count: true }),
    prisma.verkoop.aggregate({ where: { verkochtenOp: { gte: beginVorigeMaand, lte: eindeVorigeMaand } }, _sum: { totaalBedrag: true }, _count: true }),
    prisma.verkoop.findMany({ take: 6, orderBy: { verkochtenOp: 'desc' }, include: { regels: { include: { product: { select: { naam: true } } } } } }),
    prisma.verkoopRegel.groupBy({ by: ['productId'], _sum: { aantal: true, subtotaal: true }, orderBy: { _sum: { subtotaal: 'desc' } }, take: 5 }),
    prisma.verkoop.groupBy({ by: ['betalingsMethode'], _count: true, where: { verkochtenOp: { gte: beginMaand } } }),
  ])

  // Omzet per dag
  const recenteVerkopenRaw = await prisma.verkoop.findMany({
    where: { verkochtenOp: { gte: veertiendagenGeleden } },
    select: { verkochtenOp: true, totaalBedrag: true },
    orderBy: { verkochtenOp: 'asc' },
  })
  const dagMap: Record<string, number> = {}
  for (const v of recenteVerkopenRaw) {
    const dag = v.verkochtenOp.toISOString().slice(5, 10)
    dagMap[dag] = (dagMap[dag] ?? 0) + Number(v.totaalBedrag)
  }
  const verkopenPerDag = Object.entries(dagMap).map(([dag, omzet]) => ({ dag, omzet: Math.round(omzet * 100) / 100 }))

  // Omzet + marge per categorie (deze maand)
  const verkoopRegelsDezeM = await prisma.verkoopRegel.findMany({
    where: { verkoop: { verkochtenOp: { gte: beginMaand } } },
    include: { product: { include: { categorie: true } } },
  })
  const catMap: Record<string, { omzet: number; marge: number }> = {}
  for (const r of verkoopRegelsDezeM) {
    const cat = r.product.categorie.naam
    const omzet = Number(r.subtotaal)
    const marge = (Number(r.eenheidsprijs) - Number(r.product.inkoopprijs)) * r.aantal
    if (!catMap[cat]) catMap[cat] = { omzet: 0, marge: 0 }
    catMap[cat].omzet += omzet; catMap[cat].marge += marge
  }
  const verkopenPerCategorie = Object.entries(catMap)
    .map(([categorie, v]) => ({ categorie, omzet: Math.round(v.omzet * 100) / 100, marge: Math.round(v.marge * 100) / 100 }))
    .sort((a, b) => b.omzet - a.omzet)

  const verkopenPerMethode = verkopenPerMethodeRaw.map(v => ({ methode: v.betalingsMethode, aantal: v._count }))

  // Top producten met namen
  const productIds = topProducten.map(t => t.productId)
  const productenNamen = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, naam: true, inkoopprijs: true } })

  // Marge rapportage
  const margeData = topProducten.map(t => {
    const p = productenNamen.find(x => x.id === t.productId)
    const omzet = Number(t._sum.subtotaal ?? 0)
    return { naam: p?.naam ?? '–', stuks: Number(t._sum.aantal ?? 0), omzet }
  })

  // Lage voorraad
  const laagVoorraad = await prisma.product.findMany({ where: { actief: true }, select: { naam: true, sku: true, voorraadAantal: true, minVoorraad: true }, orderBy: { voorraadAantal: 'asc' }, take: 10 })

  const omzetDezeMaand = Number(verkopenDezeMaand._sum.totaalBedrag ?? 0)
  const omzetVorig = Number(verkopenVorigeMaand._sum.totaalBedrag ?? 0)
  const omzetDelta = omzetVorig > 0 ? Number(((omzetDezeMaand - omzetVorig) / omzetVorig * 100).toFixed(1)) : 0

  // Winstmarge deze maand
  const totaalMarge = verkopenPerCategorie.reduce((s, c) => s + c.marge, 0)
  const margePercentage = omzetDezeMaand > 0 ? (totaalMarge / omzetDezeMaand * 100).toFixed(1) : '0'

  return { totaalProducten, omzetDezeMaand, omzetDelta, aantalVerkopen: verkopenDezeMaand._count, totaalMarge, margePercentage,
    recenteVerkopen, margeData, verkopenPerDag, verkopenPerCategorie, verkopenPerMethode,
    laagVoorraad: laagVoorraad.filter(p => p.voorraadAantal <= p.minVoorraad) }
}

export default async function Dashboard() {
  let data
  try { data = await getDashboardData() }
  catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <div style={{ padding: 24 }}>
        <div style={{ background: 'var(--red-dim)', border: '1px solid #5a1a1a', borderRadius: 12, padding: 20 }}>
          <div style={{ color: 'var(--red)', fontWeight: 600, marginBottom: 8 }}>Database fout</div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--text-muted)' }}>{msg}</div>
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Omzet deze maand', value: formatEuro(data.omzetDezeMaand), delta: data.omzetDelta, icon: '€' },
    { label: 'Verkopen (maand)', value: String(data.aantalVerkopen), delta: null, icon: '↗' },
    { label: 'Winstmarge', value: `${data.margePercentage}%`, delta: null, icon: '◈', sub: formatEuro(data.totaalMarge) },
    { label: 'Lage voorraad', value: String(data.laagVoorraad.length), delta: null, icon: '⚠', alert: data.laagVoorraad.length > 0 },
  ]

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>{new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} className="card" style={{ borderColor: s.alert ? 'var(--amber-dim)' : 'var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: s.alert ? 'var(--amber)' : 'var(--text)', fontFamily: 'DM Mono, monospace' }}>{s.value}</div>
                {s.sub && <div style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>{s.sub}</div>}
                {s.delta !== null && <div className={s.delta >= 0 ? 'stat-delta-pos' : 'stat-delta-neg'} style={{ marginTop: 4 }}>{s.delta >= 0 ? '▲' : '▼'} {Math.abs(s.delta)}% t.o.v. vorige maand</div>}
              </div>
              <div style={{ fontSize: 22, opacity: 0.2 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <DashboardCharts verkopenPerDag={data.verkopenPerDag} verkopenPerCategorie={data.verkopenPerCategorie} verkopenPerMethode={data.verkopenPerMethode} />
        </div>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: 16 }}>Lage voorraad</div>
          {data.laagVoorraad.length === 0
            ? <div className="alert alert-green"><span>✓</span> Alles voldoende</div>
            : data.laagVoorraad.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--amber-dim)', marginBottom: 6 }}>
                <div><div style={{ fontSize: 12, fontWeight: 500 }}>{p.naam}</div><div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'DM Mono, monospace' }}>{p.sku}</div></div>
                <div style={{ textAlign: 'right' }}><div className="badge badge-amber">{p.voorraadAantal}</div><div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>min {p.minVoorraad}</div></div>
              </div>
            ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>Recente verkopen</div>
          <table className="tabel">
            <thead><tr><th>Product</th><th>Datum</th><th style={{textAlign:'right'}}>Bedrag</th></tr></thead>
            <tbody>
              {data.recenteVerkopen.map(v => (
                <tr key={v.id}>
                  <td style={{ fontSize: 12 }}>{v.regels[0]?.product?.naam ?? '–'}{v.regels.length > 1 ? ` +${v.regels.length - 1}` : ''}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>{formatDatumKort(v.verkochtenOp)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{formatEuro(v.totaalBedrag)}</td>
                </tr>
              ))}
              {data.recenteVerkopen.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 12 }}>Nog geen verkopen</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>Top producten + marge</div>
          <table className="tabel">
            <thead><tr><th>Product</th><th style={{textAlign:'right'}}>Stuks</th><th style={{textAlign:'right'}}>Omzet</th></tr></thead>
            <tbody>
              {data.margeData.map((t, i) => (
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
