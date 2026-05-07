import { prisma } from '../../lib/prisma'
import NieuwProductForm from './NieuwProductForm'

export default async function NieuwProductPage() {
  const [categorieen, leveranciers] = await Promise.all([
    prisma.categorie.findMany({ orderBy: { naam: 'asc' } }),
    prisma.leverancier.findMany({ orderBy: { naam: 'asc' } }),
  ])

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Nieuw product</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>Voeg een product toe aan de catalogus</p>
      </div>
      <NieuwProductForm categorieen={categorieen} leveranciers={leveranciers} />
    </div>
  )
}
