export const dynamic = 'force-dynamic'
import { prisma } from '../../../lib/prisma'
import { notFound } from 'next/navigation'
import ProductEditForm from './ProductEditForm'

export default async function ProductEditPage({ params }: { params: { id: string } }) {
  const [product, categorieen, leveranciers] = await Promise.all([
    prisma.product.findUnique({ where: { id: params.id } }),
    prisma.categorie.findMany({ orderBy: { naam: 'asc' } }),
    prisma.leverancier.findMany({ orderBy: { naam: 'asc' } }),
  ])

  if (!product) notFound()

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Product bewerken</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>{product.naam}</p>
      </div>
      <ProductEditForm product={product as any} categorieen={categorieen} leveranciers={leveranciers} />
    </div>
  )
}
