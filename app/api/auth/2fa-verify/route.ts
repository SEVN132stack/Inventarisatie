export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { verifieerTotp } from '../../../lib/twofa'

export async function POST(req: NextRequest) {
  try {
    const { email, code, methode } = await req.json()

    const gebruiker = await prisma.gebruiker.findUnique({ where: { email } })
    if (!gebruiker) return NextResponse.json({ geldig: false }, { status: 400 })

    let geldig = false

    if (methode === 'totp' && gebruiker.twofaSecret) {
      geldig = verifieerTotp(code, gebruiker.twofaSecret)
    } else if (methode === 'email') {
      const nu = new Date()
      geldig = !!(
        gebruiker.twofaEmailCode === code &&
        gebruiker.twofaCodeVerval &&
        gebruiker.twofaCodeVerval > nu
      )
      if (geldig) {
        // Verbruik de code
        await prisma.gebruiker.update({
          where: { id: gebruiker.id },
          data: { twofaEmailCode: null, twofaCodeVerval: null },
        })
      }
    }

    return NextResponse.json({ geldig })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
