import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../lib/prisma'

export async function GET() {
  const verkopen = await prisma.verkoop.findMany({
    orderBy: { verkochtenOp: 'desc' },
    take: 50,
    include: {
      gebruiker: { select: { naam: true } },
      regels: { include: { product: { select: { naam: true } } } }
    }
  })
  return NextResponse.json(verkopen)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { betalingsMethode, notitie, regels } = body

    if (!regels || regels.length === 0) {
      return NextResponse.json({ error: 'Geen producten opgegeven' }, { status: 400 })
    }

    // Gebruik eerste admin voor nu (in productie: uit session/auth halen)
    const gebruiker = await prisma.gebruiker.findFirst({ where: { rol: 'ADMIN' } })
    if (!gebruiker) return NextResponse.json({ error: 'Geen gebruiker gevonden' }, { status: 400 })

    // Bereken totalen
    const verrijkteRegels = regels.map((r: any) => ({
      ...r,
      eenheidsprijs: parseFloat(r.eenheidsprijs),
      btw: parseFloat(r.btw),
      subtotaal: parseFloat(r.eenheidsprijs) * parseInt(r.aantal),
      korting: 0,
    }))
    const totaalBedrag = verrijkteRegels.reduce((s: number, r: any) => s + r.subtotaal, 0)

    // Transactie: verkoop + voorraad update + mutaties
    const verkoop = await prisma.$transaction(async (tx) => {
      // Maak verkoop aan
      const v = await tx.verkoop.create({
        data: {
          gebruikerId: gebruiker.id,
          betalingsMethode: betalingsMethode ?? 'PIN',
          totaalBedrag,
          notitie: notitie || null,
          regels: {
            create: verrijkteRegels.map((r: any) => ({
              productId: r.productId,
              aantal: parseInt(r.aantal),
              eenheidsprijs: r.eenheidsprijs,
              btw: r.btw,
              subtotaal: r.subtotaal,
              korting: 0,
            }))
          }
        }
      })

      // Update voorraad per product
      for (const r of verrijkteRegels) {
        const aantal = parseInt(r.aantal)
        await tx.product.update({
          where: { id: r.productId },
          data: { voorraadAantal: { decrement: aantal } }
        })

        await tx.voorraadMutatie.create({
          data: {
            productId: r.productId,
            gebruikerId: gebruiker.id,
            delta: -aantal,
            redenType: 'VERKOOP',
            verkoopId: v.id,
          }
        })
      }

      return v
    })

    return NextResponse.json(verkoop, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
