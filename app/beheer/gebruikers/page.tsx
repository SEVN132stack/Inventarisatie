export const dynamic = 'force-dynamic'
import { prisma } from '../../lib/prisma'
import GebruikersBeheer from './GebruikersBeheer'

export default async function GebruikersPage() {
  const gebruikers = await prisma.gebruiker.findMany({
    select: { id: true, naam: true, email: true, rol: true, actief: true, aangemaaktOp: true },
    orderBy: { naam: 'asc' },
  })
  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Gebruikersbeheer</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>Accounts beheren en toegang instellen</p>
      </div>
      <GebruikersBeheer gebruikers={gebruikers as any} />
    </div>
  )
}
