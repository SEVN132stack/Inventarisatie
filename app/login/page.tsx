'use client'
import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Al ingelogd? Stuur door naar dashboard
  useEffect(() => {
    if (status === 'authenticated') router.replace('/')
  }, [status, router])

  if (status === 'loading') return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await signIn('credentials', {
      email,
      wachtwoord,
      redirect: false,
    })
    if (res?.ok) {
      router.replace('/')
      router.refresh()
    } else {
      setError('Ongeldig e-mailadres of wachtwoord')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{ width: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52,
            background: 'var(--accent)',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 700, color: '#fff',
            margin: '0 auto 14px',
          }}>W</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>WinkelPro</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>Inventarisatie Systeem</div>
        </div>

        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: 'var(--text)' }}>Inloggen</div>

          {error && (
            <div className="alert alert-red" style={{ marginBottom: 16 }}>
              ✕ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="field-label">E-mailadres</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                placeholder="admin@winkel.nl"
              />
            </div>
            <div>
              <label className="field-label">Wachtwoord</label>
              <input
                className="input"
                type="password"
                value={wachtwoord}
                onChange={e => setWachtwoord(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px 0', marginTop: 4 }}
              disabled={loading}
            >
              {loading ? 'Inloggen...' : 'Inloggen →'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--text-dim)' }}>
          WinkelPro v1.0 · Beveiligd systeem
        </div>
      </div>
    </div>
  )
}
