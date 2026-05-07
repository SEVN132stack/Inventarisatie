export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { genereerEmailOtp, stuurOtpMail } from '../../../lib/twofa'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const gebruiker = await prisma.gebruiker.findUnique({ where: { email } })
    if (!gebruiker) return NextResponse.json({ ok: true }) // Geen info lekken

    const code = genereerEmailOtp()
    const verval = new Date(Date.now() + 10 * 60 * 1000) // 10 minuten

    await prisma.gebruiker.update({
      where: { id: gebruiker.id },
      data: { twofaEmailCode: code, twofaCodeVerval: verval },
    })

    await stuurOtpMail(gebruiker.email, gebruiker.naam, code)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
