'use client'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type Stap = 'keuze' | 'totp-qr' | 'totp-verif' | 'email-verif' | 'klaar'

export default function TwofaSetup() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stap, setStap] = useState<Stap>('keuze')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailVerzonden, setEmailVerzonden] = useState(false)

  const userId = (session?.user as any)?.id

  async function laadTotp() {
    setLoading(true)
    const res = await fetch('/api/auth/2fa-setup', {
      headers: { 'x-user-id': userId },
    })
    const data = await res.json()
    setQrDataUrl(data.qrDataUrl)
    setSecret(data.secret)
    setLoading(false)
    setStap('totp-qr')
  }

  async function kiesEmail() {
    setLoading(true)
    // Stuur een testcode
    await fetch('/api/auth/2fa-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: session?.user?.email }),
    })
    setEmailVerzonden(true)
    setLoading(false)
    setStap('email-verif')
  }

  async function bevestigTotp() {
    if (code.replace(/\s/g, '').length < 6) return
    setLoading(true); setError('')
    const res = await fetch('/api/auth/2fa-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code: code.replace(/\s/g, ''), methode: 'totp' }),
    })
    if (res.ok) { setStap('klaar') }
    else { const d = await res.json(); setError(d.error ?? 'Ongeldige code') }
    setLoading(false)
  }

  async function bevestigEmail() {
    if (code.length < 6) return
    setLoading(true); setError('')
    const res = await fetch('/api/auth/2fa-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: session?.user?.email, code, methode: 'email' }),
    })
    const data = await res.json()
    if (data.geldig) {
      // Sla methode op
      await fetch('/api/auth/2fa-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code, methode: 'email' }),
      })
      setStap('klaar')
    } else {
      setError('Ongeldige of verlopen code')
    }
    setLoading(false)
  }

  if (stap === 'keuze') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="alert alert-amber">
        ⚠ Je account heeft nog geen tweestapsverificatie. Kies een methode om je account te beveiligen.
      </div>

      {/* TOTP optie */}
      <div className="card" style={{ cursor: 'pointer', border: '1px solid var(--border)', transition: 'border-color 0.15s' }}
        onClick={laadTotp}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 32 }}>📱</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Google Authenticator (aanbevolen)</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Scan een QR-code met de Authenticator app. Werkt ook offline en is het veiligst.
            </div>
            <div style={{ marginTop: 10 }}>
              <span className="badge badge-green">Meest veilig</span>
              <span className="badge badge-blue" style={{ marginLeft: 6 }}>Werkt offline</span>
            </div>
          </div>
        </div>
      </div>

      {/* E-mail optie */}
      <div className="card" style={{ cursor: 'pointer', border: '1px solid var(--border)', transition: 'border-color 0.15s' }}
        onClick={kiesEmail}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 32 }}>📧</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>E-mail verificatie</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Ontvang een code per e-mail bij elke login. Vereist internettoegang.
            </div>
            <div style={{ marginTop: 10 }}>
              <span className="badge badge-amber">Minder veilig</span>
              <span className="badge badge-purple" style={{ marginLeft: 6 }}>Geen app nodig</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (stap === 'totp-qr') return (
    <div className="card">
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>📱 Stap 1 — Scan de QR-code</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        Open Google Authenticator, tik op <strong>+</strong> en scan de onderstaande code.
      </div>

      {qrDataUrl && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src={qrDataUrl} alt="QR Code" style={{ width: 200, height: 200, border: '8px solid white', borderRadius: 12 }} />
        </div>
      )}

      <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Handmatige invoercode (als QR niet werkt)
        </div>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, letterSpacing: 3, color: 'var(--text)' }}>
          {secret.match(/.{1,4}/g)?.join(' ')}
        </div>
      </div>

      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStap('totp-verif')}>
        Ik heb de QR-code gescand →
      </button>
    </div>
  )

  if (stap === 'totp-verif') return (
    <div className="card">
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>📱 Stap 2 — Bevestig de code</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        Voer de 6-cijferige code uit je Authenticator app in om de setup te bevestigen.
      </div>
      {error && <div className="alert alert-red" style={{ marginBottom: 14 }}>✕ {error}</div>}
      <input
        className="input"
        type="text"
        inputMode="numeric"
        maxLength={7}
        value={code}
        onChange={e => setCode(e.target.value)}
        autoFocus
        placeholder="000 000"
        style={{ fontSize: 28, textAlign: 'center', letterSpacing: 8, fontFamily: 'DM Mono, monospace', marginBottom: 14 }}
      />
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={bevestigTotp} disabled={loading || code.replace(/\s/g,'').length < 6}>
          {loading ? 'Bevestigen...' : '✓ Bevestigen'}
        </button>
        <button className="btn btn-ghost" onClick={() => setStap('totp-qr')}>← Terug</button>
      </div>
    </div>
  )

  if (stap === 'email-verif') return (
    <div className="card">
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>📧 E-mail verificatie instellen</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        {emailVerzonden
          ? <>Een testcode is verzonden naar <strong style={{ color: 'var(--text)' }}>{session?.user?.email}</strong>. Voer hem hieronder in om e-mail verificatie te bevestigen.</>
          : 'Code verzenden...'}
      </div>
      {error && <div className="alert alert-red" style={{ marginBottom: 14 }}>✕ {error}</div>}
      <input
        className="input"
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={e => setCode(e.target.value)}
        autoFocus
        placeholder="000000"
        style={{ fontSize: 28, textAlign: 'center', letterSpacing: 8, fontFamily: 'DM Mono, monospace', marginBottom: 14 }}
      />
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={bevestigEmail} disabled={loading || code.length < 6}>
          {loading ? 'Bevestigen...' : '✓ Bevestigen'}
        </button>
        <button className="btn btn-ghost" onClick={() => setStap('keuze')}>← Terug</button>
      </div>
    </div>
  )

  if (stap === 'klaar') return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--green)', marginBottom: 8 }}>
        2FA succesvol ingesteld!
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        Log opnieuw in om door te gaan. Vanaf nu is tweestapsverificatie vereist bij elke login.
      </div>
      <button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => signOut({ callbackUrl: '/login' })}
      >
        Opnieuw inloggen →
      </button>
    </div>
  )

  return null
}
