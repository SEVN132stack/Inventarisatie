export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { z } from 'zod'

const schema = z.object({
  productId: z.string().uuid(),
  aantal:    z.number().int().positive(),
  notitie:   z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    const gebruiker = await prisma.gebruiker.findFirst({ where: { rol: 'ADMIN', actief: true } })
    if (!gebruiker) return NextResponse.json({ error: 'Geen gebruiker' }, { status: 400 })

    await prisma.$transaction([
      prisma.product.update({ where: { id: body.productId }, data: { voorraadAantal: { increment: body.aantal } } }),
      prisma.voorraadMutatie.create({ data: { productId: body.productId, gebruikerId: gebruiker.id, delta: body.aantal, redenType: 'AANVULLING', notitie: body.notitie ?? null } }),
    ])
    const product = await prisma.product.findUnique({ where: { id: body.productId }, select: { naam: true, voorraadAantal: true } })
    return NextResponse.json({ ok: true, product })
  } catch (e: unknown) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 }) }
}
