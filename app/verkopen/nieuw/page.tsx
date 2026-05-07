import { prisma } from '../../lib/prisma'
import NieuweVerkoopForm from './NieuweVerkoopForm'

export default async function NieuweVerkoopPage() {
  const producten = await prisma.product.findMany({
    where: { actief: true, voorraadAantal: { gt: 0 } },
    orderBy: { naam: 'asc' },
    select: { id: true, naam: true, sku: true, verkoopprijs: true, btw: true, voorraadAantal: true, eenheid: true },
  })

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Verkoop registreren</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>Voeg producten toe en verwerk de betaling</p>
      </div>
      <NieuweVerkoopForm producten={producten as any} />
    </div>
  )
}
