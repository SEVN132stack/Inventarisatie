export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { z } from 'zod'

const schema = z.object({ naam: z.string().min(1), contactpersoon: z.string().optional(), email: z.string().email().optional().or(z.literal('')), telefoon: z.string().optional(), website: z.string().optional() })

export async function GET() {
  return NextResponse.json(await prisma.leverancier.findMany({ orderBy: { naam: 'asc' }, include: { _count: { select: { producten: true } } } }))
}
export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    return NextResponse.json(await prisma.leverancier.create({ data: { ...body, email: body.email || null } }), { status: 201 })
  } catch (e: unknown) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 }) }
}
