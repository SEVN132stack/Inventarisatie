export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ontvangerEmail, ontvangerNaam, verzendDag } = body
    if (!ontvangerEmail) return NextResponse.json({ error: 'E-mail verplicht' }, { status: 400 })

    const instelling = await prisma.emailInstelling.upsert({
      where: { ontvangerEmail },
      update: { ontvangerNaam, verzendDag: parseInt(verzendDag ?? '1'), actief: true },
      create: { ontvangerEmail, ontvangerNaam, verzendDag: parseInt(verzendDag ?? '1') },
    })
    return NextResponse.json(instelling, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
