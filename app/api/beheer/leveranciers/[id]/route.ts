export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    return NextResponse.json(await prisma.leverancier.update({ where: { id: params.id }, data: { naam: body.naam, contactpersoon: body.contactpersoon || null, email: body.email || null, telefoon: body.telefoon || null, website: body.website || null } }))
  } catch (e: unknown) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 }) }
}
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.leverancier.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 }) }
}
