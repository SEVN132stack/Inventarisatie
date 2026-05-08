'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

const nav = [
  { href: '/',                      label: 'Dashboard',    icon: '◈' },
  { href: '/producten',             label: 'Producten',    icon: '▦' },
  { href: '/verkopen',              label: 'Verkopen',     icon: '⟳' },
  { href: '/voorraad',              label: 'Voorraad',     icon: '▣' },
  { href: '/rapportages',           label: 'Rapportages',  icon: '◉' },
  { label: 'BEHEER', divider: true },
  { href: '/beheer/gebruikers',     label: 'Gebruikers',   icon: '◎', adminOnly: true },
  { href: '/beheer/categorieen',    label: 'Categorieën',  icon: '◫', adminOnly: true },
  { href: '/beheer/leveranciers',   label: 'Leveranciers', icon: '◧', adminOnly: true },
  { href: '/instellingen',          label: 'Instellingen', icon: '⚙', adminOnly: true },
]

export default function Sidebar() {
  const path = usePathname()
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  return (
    <aside style={{ width: 220, minHeight: '100vh', background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 }}>
      <div style={{ padding: '0 20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>W</div>
          <div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>WinkelPro</div><div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Inventarisatie v1.0</div></div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '0 10px' }}>
        {nav.map((item, i) => {
          if ('divider' in item) return (
            <div key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '12px 12px 4px' }}>{item.label}</div>
          )
          if (item.adminOnly && !isAdmin) return null
          const active = path === item.href || (item.href !== '/' && path.startsWith(item.href!))
          return (
            <Link key={item.href} href={item.href!} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, marginBottom: 2, background: active ? 'var(--accent-dim)' : 'transparent', color: active ? 'var(--accent)' : 'var(--text-muted)', fontSize: 13, fontWeight: active ? 600 : 400, transition: 'all 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg3)' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                <span style={{ fontSize: 15, opacity: active ? 1 : 0.6 }}>{item.icon}</span>{item.label}
              </div>
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 2 }}>{session?.user?.name ?? 'Gebruiker'}</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>{session?.user?.email}</div>
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 11, padding: '5px 0' }} onClick={() => signOut({ callbackUrl: window.location.origin + '/login' })}>
          Uitloggen
        </button>
      </div>
    </aside>
  )
}
