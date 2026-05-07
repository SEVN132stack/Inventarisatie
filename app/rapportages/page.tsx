export const dynamic = 'force-dynamic'
import { prisma } from '../lib/prisma'
import { formatDatum, formatEuro } from '../lib/utils'
import RapportageForm from './RapportageForm'

export default async function RapportagesPage() {
  const rapportages = await prisma.rapportage.findMany({
    orderBy: { aangemaaktOp: 'desc' },
    take: 20,
    include: {
      gegenereerddoor: { select: { naam: true } },
      emailLogs: { select: { status: true, verzondenOp: true, ontvanger: true }, orderBy: { verzondenOp: 'desc' }, take: 1 },
    }
  })

  const emailInstellingen = await prisma.emailInstelling.findMany()

  const statusBadge: Record<string, string> = {
    GEREED: 'badge-green',
    IN_WACHTRIJ: 'badge-amber',
    GENEREREN: 'badge-blue',
    MISLUKT: 'badge-red',
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Rapportages</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>Genereer en verstuur periodieke overzichten</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Rapportages lijst */}
        <div>
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>Gegenereerde rapportages</div>
            </div>
            {rapportages.length === 0
              ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>Nog geen rapportages gegenereerd</div>
              : <table className="tabel">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Periode</th>
                      <th>Status</th>
                      <th>E-mail</th>
                      <th>Datum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rapportages.map(r => {
                      const samenvatting = r.samenvatting as any
                      return (
                        <tr key={r.id}>
                          <td>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>{r.type}</div>
                            {samenvatting?.omzet && <div style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'DM Mono, monospace' }}>{formatEuro(samenvatting.omzet)}</div>}
                          </td>
                          <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                            {formatDatum(r.periodeStart)} – {formatDatum(r.periodeEinde)}
                          </td>
                          <td><span className={`badge ${statusBadge[r.status] ?? 'badge-blue'}`}>{r.status}</span></td>
                          <td>
                            {r.emailLogs[0]
                              ? <span className={`badge ${r.emailLogs[0].status === 'VERZONDEN' ? 'badge-green' : 'badge-red'}`}>
                                  {r.emailLogs[0].status === 'VERZONDEN' ? '✓ Verzonden' : '✕ Mislukt'}
                                </span>
                              : <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>—</span>}
                          </td>
                          <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'var(--text-dim)' }}>{formatDatum(r.aangemaaktOp)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>}
          </div>
        </div>

        {/* Sidebar: genereren + email */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RapportageForm />

          {/* Email instellingen */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: 14 }}>Automatische e-mail</div>
            {emailInstellingen.length === 0
              ? <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>Geen ontvangers ingesteld. Ga naar Instellingen.</div>
              : emailInstellingen.map(e => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg3)', borderRadius: 8, marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{e.ontvangerNaam ?? e.ontvangerEmail}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{e.ontvangerEmail} · dag {e.verzendDag}</div>
                    </div>
                    <span className={`badge ${e.actief ? 'badge-green' : 'badge-red'}`}>{e.actief ? 'Actief' : 'Inactief'}</span>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  )
}
