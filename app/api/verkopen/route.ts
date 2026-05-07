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

interface VerkoopRegel {
  productId: string
  aantal: string | number
  eenheidsprijs: string | number
  btw: string | number
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { betalingsMethode, notitie, regels } = body

    if (!regels || regels.length === 0) {
      return NextResponse.json({ error: 'Geen producten opgegeven' }, { status: 400 })
    }

    const gebruiker = await prisma.gebruiker.findFirst({ where: { rol: 'ADMIN' } })
    if (!gebruiker) return NextResponse.json({ error: 'Geen gebruiker gevonden' }, { status: 400 })

    const verrijkteRegels = regels.map((r: VerkoopRegel) => ({
      ...r,
      eenheidsprijs: parseFloat(String(r.eenheidsprijs)),
      btw: parseFloat(String(r.btw)),
      subtotaal: parseFloat(String(r.eenheidsprijs)) * parseInt(String(r.aantal)),
      korting: 0,
    }))
    const totaalBedrag = verrijkteRegels.reduce((s: number, r: { subtotaal: number }) => s + r.subtotaal, 0)

    const verkoop = await prisma.$transaction(async (tx) => {
      const v = await tx.verkoop.create({
        data: {
          gebruikerId: gebruiker.id,
          betalingsMethode: betalingsMethode ?? 'PIN',
          totaalBedrag,
          notitie: notitie || null,
          regels: {
            create: verrijkteRegels.map((r: VerkoopRegel & { subtotaal: number; korting: number }) => ({
              productId: r.productId,
              aantal: parseInt(String(r.aantal)),
              eenheidsprijs: r.eenheidsprijs,
              btw: r.btw,
              subtotaal: r.subtotaal,
              korting: 0,
            }))
          }
        }
      })

      for (const r of verrijkteRegels) {
        const aantal = parseInt(String(r.aantal))
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
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
