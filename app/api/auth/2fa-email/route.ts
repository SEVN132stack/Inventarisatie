export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { genereerEmailOtp, stuurOtpMail } from '../../../lib/twofa'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body
    console.log('[2fa-email] Verzoek voor:', email)

    if (!email) {
      console.log('[2fa-email] Geen e-mail opgegeven')
      return NextResponse.json({ error: 'Geen e-mail opgegeven' }, { status: 400 })
    }

    const gebruiker = await prisma.gebruiker.findUnique({ where: { email } })
    if (!gebruiker) {
      console.log('[2fa-email] Gebruiker niet gevonden:', email)
      return NextResponse.json({ ok: true }) // Geen info lekken
    }

    const code = genereerEmailOtp()
    const verval = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.gebruiker.update({
      where: { id: gebruiker.id },
      data: { twofaEmailCode: code, twofaCodeVerval: verval },
    })

    console.log('[2fa-email] Code aangemaakt voor', email, '— versturen...')
    await stuurOtpMail(gebruiker.email, gebruiker.naam, code)
    console.log('[2fa-email] ✓ Mail verzonden naar', email)

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[2fa-email] ✗ Fout:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
