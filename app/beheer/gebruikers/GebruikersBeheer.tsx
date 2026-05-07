'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Gebruiker { id: string; naam: string; email: string; rol: string; actief: boolean }

export default function GebruikersBeheer({ gebruikers }: { gebruikers: Gebruiker[] }) {
  const router = useRouter()
  const [toonForm, setToonForm] = useState(false)
  const [naam, setNaam] = useState(''); const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState(''); const [rol, setRol] = useState('MEDEWERKER')
  const [loading, setLoading] = useState(false); const [error, setError] = useState('')

  async function voegToe() {
    setLoading(true); setError('')
    const res = await fetch('/api/beheer/gebruikers', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ naam, email, wachtwoord, rol }) })
    setLoading(false)
    if (res.ok) { setToonForm(false); setNaam(''); setEmail(''); setWachtwoord(''); router.refresh() }
    else { const d = await res.json(); setError(d.error ?? 'Fout') }
  }

  async function toggleActief(id: string, actief: boolean) {
    await fetch(`/api/beheer/gebruikers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actief: !actief }) })
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Lijst */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>Gebruikers ({gebruikers.length})</div>
          <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setToonForm(!toonForm)}>+ Nieuw</button>
        </div>
        <table className="tabel">
          <thead><tr><th>Naam</th><th>E-mail</th><th>Rol</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {gebruikers.map(g => (
              <tr key={g.id}>
                <td style={{ fontWeight: 500, fontSize: 13 }}>{g.naam}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.email}</td>
                <td><span className={`badge ${g.rol === 'ADMIN' ? 'badge-blue' : 'badge-purple'}`}>{g.rol}</span></td>
                <td><span className={`badge ${g.actief ? 'badge-green' : 'badge-red'}`}>{g.actief ? 'Actief' : 'Inactief'}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => toggleActief(g.id, g.actief)}>
                    {g.actief ? 'Deactiveer' : 'Activeer'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Nieuw formulier */}
      {toonForm && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Nieuwe gebruiker</div>
          {error && <div className="alert alert-red" style={{ marginBottom: 12 }}>✕ {error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label className="field-label">Naam</label><input className="input" value={naam} onChange={e => setNaam(e.target.value)} /></div>
            <div><label className="field-label">E-mail</label><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><label className="field-label">Wachtwoord (min. 8 tekens)</label><input className="input" type="password" value={wachtwoord} onChange={e => setWachtwoord(e.target.value)} /></div>
            <div><label className="field-label">Rol</label>
              <select className="input" value={rol} onChange={e => setRol(e.target.value)}>
                <option value="MEDEWERKER">Medewerker</option><option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="btn btn-primary" onClick={voegToe} disabled={loading}>{loading ? 'Opslaan...' : 'Aanmaken'}</button>
            <button className="btn btn-ghost" onClick={() => setToonForm(false)}>Annuleren</button>
          </div>
        </div>
      )}
    </div>
  )
}
