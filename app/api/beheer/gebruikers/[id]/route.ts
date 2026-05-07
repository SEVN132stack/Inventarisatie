export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (body.naam)       data.naam   = body.naam
    if (body.rol)        data.rol    = body.rol
    if (body.actief !== undefined) data.actief = body.actief
    if (body.wachtwoord) data.wachtwoord = await bcrypt.hash(body.wachtwoord, 12)
    const gebruiker = await prisma.gebruiker.update({
      where: { id: params.id }, data,
      select: { id: true, naam: true, email: true, rol: true, actief: true },
    })
    return NextResponse.json(gebruiker)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.gebruiker.update({ where: { id: params.id }, data: { actief: false } })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
