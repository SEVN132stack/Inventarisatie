'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('App error:', error) }, [error])
  return (
    <div style={{ padding: 40, maxWidth: 600 }}>
      <div style={{ background: 'var(--red-dim)', border: '1px solid #5a1a1a', borderRadius: 12, padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--red)', marginBottom: 8 }}>Server fout</div>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, wordBreak: 'break-all' }}>
          {error.message}
        </div>
        {error.digest && (
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 16 }}>Digest: {error.digest}</div>
        )}
        <button className="btn btn-ghost" onClick={reset}>Opnieuw proberen</button>
      </div>
    </div>
  )
}
