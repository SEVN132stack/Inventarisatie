export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  naam:       z.string().min(2),
  email:      z.string().email(),
  wachtwoord: z.string().min(8),
  rol:        z.enum(['ADMIN', 'MEDEWERKER']),
})

export async function GET() {
  const gebruikers = await prisma.gebruiker.findMany({
    select: { id: true, naam: true, email: true, rol: true, actief: true, aangemaaktOp: true },
    orderBy: { naam: 'asc' },
  })
  return NextResponse.json(gebruikers)
}

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    const hash = await bcrypt.hash(body.wachtwoord, 12)
    const gebruiker = await prisma.gebruiker.create({
      data: { naam: body.naam, email: body.email, wachtwoord: hash, rol: body.rol },
      select: { id: true, naam: true, email: true, rol: true, actief: true },
    })
    return NextResponse.json(gebruiker, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
