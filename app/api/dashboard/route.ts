export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '../../lib/prisma'

export async function GET() {
  const nu = new Date()
  const beginMaand = new Date(nu.getFullYear(), nu.getMonth(), 1)

  const [omzet, aantalVerkopen, totaalProducten, laagVoorraad] = await Promise.all([
    prisma.verkoop.aggregate({ where: { verkochtenOp: { gte: beginMaand } }, _sum: { totaalBedrag: true } }),
    prisma.verkoop.count({ where: { verkochtenOp: { gte: beginMaand } } }),
    prisma.product.count({ where: { actief: true } }),
    prisma.product.count({ where: { actief: true, voorraadAantal: { lte: 5 } } }),
  ])

  return NextResponse.json({
    omzetDezeMaand: Number(omzet._sum.totaalBedrag ?? 0),
    aantalVerkopen,
    totaalProducten,
    laagVoorraad,
  })
}
