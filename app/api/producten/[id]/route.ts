export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { categorie: true, leverancier: true },
  })
  if (!product) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  return NextResponse.json(product)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { naam, sku, omschrijving, categorieId, leverancierId, inkoopprijs, verkoopprijs, btw, minVoorraad, eenheid } = body

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        naam,
        sku,
        omschrijving: omschrijving || null,
        categorieId,
        leverancierId: leverancierId || null,
        inkoopprijs: parseFloat(inkoopprijs),
        verkoopprijs: parseFloat(verkoopprijs),
        btw: parseFloat(btw ?? '21'),
        minVoorraad: parseInt(minVoorraad ?? '5'),
        eenheid: eenheid || 'stuk',
      },
    })
    return NextResponse.json(product)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Soft delete — zet actief op false zodat historische data bewaard blijft
    await prisma.product.update({
      where: { id: params.id },
      data: { actief: false },
    })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
