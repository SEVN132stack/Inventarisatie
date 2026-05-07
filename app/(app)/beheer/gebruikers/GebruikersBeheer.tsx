'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Gebruiker { id: string; naam: string; email: string; rol: string; actief: boolean }

export default function GebruikersBeheer({ gebruikers }: { gebruikers: Gebruiker[] }) {
  const router = useRouter()

  // Nieuw formulier
  const [toonForm, setToonForm] = useState(false)
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [rol, setRol] = useState('MEDEWERKER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Wachtwoord wijzigen
  const [wijzigId, setWijzigId] = useState<string | null>(null)
  const [nieuwWachtwoord, setNieuwWachtwoord] = useState('')
  const [bevestigWachtwoord, setBevestigWachtwoord] = useState('')
  const [wijzigLoading, setWijzigLoading] = useState(false)
  const [wijzigError, setWijzigError] = useState('')
  const [wijzigSuccess, setWijzigSuccess] = useState('')

  async function voegToe() {
    setLoading(true); setError('')
    const res = await fetch('/api/beheer/gebruikers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ naam, email, wachtwoord, rol }),
    })
    setLoading(false)
    if (res.ok) {
      setToonForm(false); setNaam(''); setEmail(''); setWachtwoord(''); router.refresh()
    } else {
      const d = await res.json(); setError(d.error ?? 'Fout')
    }
  }

  async function toggleActief(id: string, actief: boolean) {
    await fetch(`/api/beheer/gebruikers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actief: !actief }),
    })
    router.refresh()
  }

  async function reset2fa(id: string, naam: string) {
    if (!confirm(`2FA resetten voor ${naam}? De gebruiker moet 2FA opnieuw instellen bij de volgende login.`)) return
    await fetch(`/api/beheer/gebruikers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset2fa: true }),
    })
    router.refresh()
  }

  function openWijzig(id: string) {
    setWijzigId(id)
    setNieuwWachtwoord('')
    setBevestigWachtwoord('')
    setWijzigError('')
    setWijzigSuccess('')
  }

  async function slaWachtwoordOp() {
    if (!wijzigId) return
    if (nieuwWachtwoord.length < 8) {
      setWijzigError('Wachtwoord moet minimaal 8 tekens zijn'); return
    }
    if (nieuwWachtwoord !== bevestigWachtwoord) {
      setWijzigError('Wachtwoorden komen niet overeen'); return
    }
    setWijzigLoading(true); setWijzigError(''); setWijzigSuccess('')
    const res = await fetch(`/api/beheer/gebruikers/${wijzigId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wachtwoord: nieuwWachtwoord }),
    })
    setWijzigLoading(false)
    if (res.ok) {
      setWijzigSuccess('✓ Wachtwoord gewijzigd')
      setNieuwWachtwoord('')
      setBevestigWachtwoord('')
      setTimeout(() => { setWijzigId(null); setWijzigSuccess('') }, 1500)
    } else {
      const d = await res.json(); setWijzigError(d.error ?? 'Fout')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Gebruikerslijst */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>
            Gebruikers ({gebruikers.length})
          </div>
          <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setToonForm(!toonForm)}>
            + Nieuw
          </button>
        </div>
        <table className="tabel">
          <thead>
            <tr>
              <th>Naam</th>
              <th>E-mail</th>
              <th>Rol</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {gebruikers.map(g => (
              <tr key={g.id}>
                <td style={{ fontWeight: 500, fontSize: 13 }}>{g.naam}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.email}</td>
                <td>
                  <span className={`badge ${g.rol === 'ADMIN' ? 'badge-blue' : 'badge-purple'}`}>{g.rol}</span>
                </td>
                <td>
                  <span className={`badge ${g.actief ? 'badge-green' : 'badge-red'}`}>
                    {g.actief ? 'Actief' : 'Inactief'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '3px 10px', fontSize: 11 }}
                      onClick={() => openWijzig(g.id)}
                    >
                      🔑 Wachtwoord
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '3px 10px', fontSize: 11, color: 'var(--amber)' }}
                      onClick={() => reset2fa(g.id, g.naam)}
                      title="2FA resetten"
                    >
                      🔄 2FA reset
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '3px 10px', fontSize: 11 }}
                      onClick={() => toggleActief(g.id, g.actief)}
                    >
                      {g.actief ? 'Deactiveer' : 'Activeer'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Wachtwoord wijzigen modal */}
      {wijzigId && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="card" style={{ width: 380 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                🔑 Wachtwoord wijzigen
              </div>
              <button className="btn btn-ghost" style={{ padding: '2px 8px' }} onClick={() => setWijzigId(null)}>✕</button>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Voor: <strong style={{ color: 'var(--text)' }}>
                {gebruikers.find(g => g.id === wijzigId)?.naam}
              </strong>
            </div>

            {wijzigError && <div className="alert alert-red" style={{ marginBottom: 12 }}>✕ {wijzigError}</div>}
            {wijzigSuccess && <div className="alert alert-green" style={{ marginBottom: 12 }}>{wijzigSuccess}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="field-label">Nieuw wachtwoord (min. 8 tekens)</label>
                <input
                  className="input"
                  type="password"
                  value={nieuwWachtwoord}
                  onChange={e => setNieuwWachtwoord(e.target.value)}
                  autoFocus
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="field-label">Bevestig wachtwoord</label>
                <input
                  className="input"
                  type="password"
                  value={bevestigWachtwoord}
                  onChange={e => setBevestigWachtwoord(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={e => { if (e.key === 'Enter') slaWachtwoordOp() }}
                />
              </div>

              {/* Sterkte indicator */}
              {nieuwWachtwoord.length > 0 && (
                <div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4].map(i => {
                      const sterkte = nieuwWachtwoord.length >= 12 ? 4
                        : nieuwWachtwoord.length >= 10 ? 3
                        : nieuwWachtwoord.length >= 8  ? 2 : 1
                      return (
                        <div key={i} style={{
                          flex: 1, height: 3, borderRadius: 2,
                          background: i <= sterkte
                            ? sterkte === 4 ? 'var(--green)'
                            : sterkte === 3 ? 'var(--accent)'
                            : sterkte === 2 ? 'var(--amber)'
                            : 'var(--red)'
                            : 'var(--border)',
                          transition: 'background 0.2s',
                        }} />
                      )
                    })}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                    {nieuwWachtwoord.length < 8  ? 'Te kort'
                      : nieuwWachtwoord.length < 10 ? 'Matig'
                      : nieuwWachtwoord.length < 12 ? 'Goed'
                      : 'Sterk'}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={slaWachtwoordOp}
                  disabled={wijzigLoading || nieuwWachtwoord.length < 8}
                >
                  {wijzigLoading ? 'Opslaan...' : '✓ Wachtwoord opslaan'}
                </button>
                <button className="btn btn-ghost" onClick={() => setWijzigId(null)}>
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nieuw gebruiker formulier */}
      {toonForm && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Nieuwe gebruiker</div>
          {error && <div className="alert alert-red" style={{ marginBottom: 12 }}>✕ {error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="field-label">Naam</label>
              <input className="input" value={naam} onChange={e => setNaam(e.target.value)} />
            </div>
            <div>
              <label className="field-label">E-mail</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Wachtwoord (min. 8 tekens)</label>
              <input className="input" type="password" value={wachtwoord} onChange={e => setWachtwoord(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Rol</label>
              <select className="input" value={rol} onChange={e => setRol(e.target.value)}>
                <option value="MEDEWERKER">Medewerker</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="btn btn-primary" onClick={voegToe} disabled={loading}>
              {loading ? 'Opslaan...' : 'Aanmaken'}
            </button>
            <button className="btn btn-ghost" onClick={() => setToonForm(false)}>Annuleren</button>
          </div>
        </div>
      )}
    </div>
  )
}
