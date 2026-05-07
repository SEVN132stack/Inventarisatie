export const dynamic = 'force-dynamic'
import { prisma } from '@/app/lib/prisma'
import CategorieenBeheer from './CategorieenBeheer'
export default async function CategorieenPage() {
  const categorieen = await prisma.categorie.findMany({ orderBy: { naam: 'asc' }, include: { _count: { select: { producten: true } } } })
  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 28 }}><h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Categorieën</h1><p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>Productcategorieën beheren</p></div>
      <CategorieenBeheer categorieen={categorieen as any} />
    </div>
  )
}
