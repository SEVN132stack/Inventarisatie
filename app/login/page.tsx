'use client'
import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type Stap = 'inloggen' | '2fa-keuze' | '2fa-totp' | '2fa-email' | '2fa-setup'

export default function LoginPage() {
  const router = useRouter()
  const { status } = useSession()

  const [stap, setStap] = useState<Stap>('inloggen')
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [twofaCode, setTwofaCode] = useState('')
  const [twofaMethode, setTwofaMethode] = useState<'totp' | 'email'>('totp')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailVerzonden, setEmailVerzonden] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') router.replace('/')
  }, [status, router])

  if (status === 'loading') return null

  // ── Stap 1: Wachtwoord inloggen ───────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const res = await signIn('credentials', { email, wachtwoord, redirect: false })

    if (res?.ok) {
      router.replace('/')
      router.refresh()
      return
    }

    // Detecteer 2FA vereist via de error in de URL of response
    const errMsg = res?.error ?? ''

    if (errMsg.includes('2FA_REQUIRED')) {
      const methode = errMsg.includes(':email') ? 'email' : 'totp'
      setTwofaMethode(methode)
      if (methode === 'email') {
        // Stuur meteen een code
        await stuurEmailCode()
        setStap('2fa-email')
      } else {
        setStap('2fa-totp')
      }
    } else if (errMsg.includes('2FA_INVALID')) {
      setError('Ongeldige 2FA code')
    } else {
      setError('Ongeldig e-mailadres of wachtwoord')
    }
    setLoading(false)
  }

  // ── Stap 2: 2FA code verifiëren ───────────────────────────────────────────
  async function handleTwofa(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const res = await signIn('credentials', {
      email,
      wachtwoord,
      twofaCode: twofaCode.replace(/\s/g, ''),
      redirect: false,
    })

    if (res?.ok) {
      router.replace('/')
      router.refresh()
    } else {
      setError('Ongeldige of verlopen code. Probeer opnieuw.')
      setTwofaCode('')
      setLoading(false)
    }
  }

  // ── E-mail OTP sturen ─────────────────────────────────────────────────────
  async function stuurEmailCode() {
    setEmailVerzonden(false)
    await fetch('/api/auth/2fa-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setEmailVerzonden(true)
  }

  // ── Gedeelde UI ───────────────────────────────────────────────────────────
  const Card = ({ children }: { children: React.ReactNode }) => (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/logo.png" alt="Logo" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', marginBottom: 10 }} />
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>The Fantasy Realm</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Inventarisatie Systeem</div>
        </div>
        <div className="card">{children}</div>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--text-dim)' }}>
          WinkelPro v1.0 · Beveiligd systeem
        </div>
      </div>
    </div>
  )

  // ── Stap: inloggen ────────────────────────────────────────────────────────
  if (stap === 'inloggen') return (
    <Card>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Inloggen</div>
      {error && <div className="alert alert-red" style={{ marginBottom: 16 }}>✕ {error}</div>}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="field-label">E-mailadres</label>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus autoComplete="email" placeholder="admin@winkel.nl" />
        </div>
        <div>
          <label className="field-label">Wachtwoord</label>
          <input className="input" type="password" value={wachtwoord} onChange={e => setWachtwoord(e.target.value)} required autoComplete="current-password" placeholder="••••••••" />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px 0', marginTop: 4 }} disabled={loading}>
          {loading ? 'Controleren...' : 'Inloggen →'}
        </button>
      </form>
    </Card>
  )

  // ── Stap: TOTP code ───────────────────────────────────────────────────────
  if (stap === '2fa-totp') return (
    <Card>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>🔐 Verificatie</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        Open Google Authenticator en voer de 6-cijferige code in.
      </div>
      {error && <div className="alert alert-red" style={{ marginBottom: 16 }}>✕ {error}</div>}
      <form onSubmit={handleTwofa} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="field-label">Authenticator code</label>
          <input
            className="input"
            type="text"
            inputMode="numeric"
            pattern="[0-9 ]*"
            maxLength={7}
            value={twofaCode}
            onChange={e => setTwofaCode(e.target.value)}
            autoFocus
            autoComplete="one-time-code"
            placeholder="000 000"
            style={{ fontSize: 24, textAlign: 'center', letterSpacing: 6, fontFamily: 'DM Mono, monospace' }}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px 0' }} disabled={loading || twofaCode.replace(/\s/g, '').length < 6}>
          {loading ? 'Verifiëren...' : 'Verifiëren →'}
        </button>
        <button type="button" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setStap('inloggen'); setError(''); setTwofaCode('') }}>
          ← Terug naar inloggen
        </button>
      </form>
    </Card>
  )

  // ── Stap: e-mail OTP ──────────────────────────────────────────────────────
  if (stap === '2fa-email') return (
    <Card>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>📧 E-mailverificatie</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        {emailVerzonden
          ? <>Een 6-cijferige code is verstuurd naar <strong style={{ color: 'var(--text)' }}>{email}</strong>. Controleer je inbox.</>
          : 'Code versturen...'}
      </div>
      {error && <div className="alert alert-red" style={{ marginBottom: 16 }}>✕ {error}</div>}
      <form onSubmit={handleTwofa} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="field-label">Verificatiecode</label>
          <input
            className="input"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={twofaCode}
            onChange={e => setTwofaCode(e.target.value)}
            autoFocus
            placeholder="000000"
            style={{ fontSize: 24, textAlign: 'center', letterSpacing: 6, fontFamily: 'DM Mono, monospace' }}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px 0' }} disabled={loading || twofaCode.length < 6}>
          {loading ? 'Verifiëren...' : 'Verifiëren →'}
        </button>
        <button type="button" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={async () => { setTwofaCode(''); await stuurEmailCode() }}>
          ↻ Nieuwe code sturen
        </button>
        <button type="button" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setStap('inloggen'); setError(''); setTwofaCode('') }}>
          ← Terug naar inloggen
        </button>
      </form>
    </Card>
  )

  return null
}
