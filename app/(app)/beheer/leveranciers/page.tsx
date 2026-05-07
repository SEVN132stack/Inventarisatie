export const dynamic = 'force-dynamic'
import { prisma } from '@/app/lib/prisma'
import LeveranciersBeheer from './LeveranciersBeheer'
export default async function LeveranciersPage() {
  const leveranciers = await prisma.leverancier.findMany({ orderBy: { naam: 'asc' }, include: { _count: { select: { producten: true } } } })
  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 28 }}><h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Leveranciers</h1><p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>Leveranciers beheren</p></div>
      <LeveranciersBeheer leveranciers={leveranciers as any} />
    </div>
  )
}
