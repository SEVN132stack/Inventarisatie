export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { genereerTotpSecret, verifieerTotp } from '../../../lib/twofa'
import QRCode from 'qrcode'

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

    const gebruiker = await prisma.gebruiker.findUnique({ where: { id: userId } })
    if (!gebruiker) return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 })

    const { secret, otpauthUrl } = genereerTotpSecret()
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl)

    // Sla secret tijdelijk op
    await prisma.gebruiker.update({ where: { id: userId }, data: { twofaSecret: secret } })

    return NextResponse.json({ secret, qrDataUrl })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, code, methode } = await req.json()
    if (!userId || !methode) return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 })

    const gebruiker = await prisma.gebruiker.findUnique({ where: { id: userId } })
    if (!gebruiker) return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 })

    if (methode === 'totp') {
      if (!gebruiker.twofaSecret || !verifieerTotp(code, gebruiker.twofaSecret)) {
        return NextResponse.json({ error: 'Ongeldige code — probeer opnieuw' }, { status: 400 })
      }
    }

    await prisma.gebruiker.update({
      where: { id: userId },
      data: { twofaIngesteld: true, twofaMethode: methode },
    })

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
