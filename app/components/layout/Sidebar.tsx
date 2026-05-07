'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/',             label: 'Dashboard',    icon: '◈' },
  { href: '/producten',    label: 'Producten',    icon: '▦' },
  { href: '/verkopen',     label: 'Verkopen',     icon: '⟳' },
  { href: '/voorraad',     label: 'Voorraad',     icon: '▣' },
  { href: '/rapportages',  label: 'Rapportages',  icon: '◉' },
  { href: '/instellingen', label: 'Instellingen', icon: '◎' },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: 'var(--accent)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#fff',
          }}>W</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>WinkelPro</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Inventarisatie v1.0</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '0 10px' }}>
        {nav.map(({ href, label, icon }) => {
          const active = path === href || (href !== '/' && path.startsWith(href))
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                background: active ? 'var(--accent-dim)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 13, fontWeight: active ? 600 : 400,
                transition: 'all 0.15s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg3)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <span style={{ fontSize: 15, opacity: active ? 1 : 0.6 }}>{icon}</span>
                {label}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>admin@winkel.nl</div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          marginTop: 4, padding: '2px 8px',
          background: 'var(--accent-dim)', borderRadius: 4,
          fontSize: 10, color: 'var(--accent)', fontWeight: 500,
        }}>ADMIN</div>
      </div>
    </aside>
  )
}
