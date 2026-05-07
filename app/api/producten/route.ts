export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../lib/prisma'

export async function GET() {
  const producten = await prisma.product.findMany({
    where: { actief: true },
    include: { categorie: true, leverancier: true },
    orderBy: { naam: 'asc' },
  })
  return NextResponse.json(producten)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { naam, sku, omschrijving, categorieId, leverancierId, inkoopprijs, verkoopprijs, btw, voorraadAantal, minVoorraad, eenheid } = body

    if (!naam || !sku || !categorieId || !inkoopprijs || !verkoopprijs) {
      return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 })
    }

    // Check duplicate SKU
    const bestaand = await prisma.product.findUnique({ where: { sku } })
    if (bestaand) return NextResponse.json({ error: 'SKU bestaat al' }, { status: 400 })

    const product = await prisma.product.create({
      data: {
        naam, sku,
        omschrijving: omschrijving || null,
        categorieId,
        leverancierId: leverancierId || null,
        inkoopprijs: parseFloat(inkoopprijs),
        verkoopprijs: parseFloat(verkoopprijs),
        btw: parseFloat(btw ?? '21'),
        voorraadAantal: parseInt(voorraadAantal ?? '0'),
        minVoorraad: parseInt(minVoorraad ?? '5'),
        eenheid: eenheid || 'stuk',
      }
    })

    // Initiële voorraadmutatie indien van toepassing
    if (parseInt(voorraadAantal ?? '0') > 0) {
      const adminUser = await prisma.gebruiker.findFirst({ where: { rol: 'ADMIN' } })
      if (adminUser) {
        await prisma.voorraadMutatie.create({
          data: {
            productId: product.id,
            gebruikerId: adminUser.id,
            delta: parseInt(voorraadAantal),
            redenType: 'AANVULLING',
            notitie: 'Beginvoorraad bij aanmaken product',
          }
        })
      }
    }

    return NextResponse.json(product, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
