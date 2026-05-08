export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { verstuurMail } from '../../lib/mailer'

export async function GET(req: NextRequest) {
  if (process.env.TEST_MAIL_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Test mail niet ingeschakeld. Voeg TEST_MAIL_ENABLED=true toe aan .env' }, { status: 403 })
  }

  const naar = req.nextUrl.searchParams.get('naar') ?? process.env.EMAIL_FROM ?? ''
  if (!naar) return NextResponse.json({ error: 'Geen ontvanger. Gebruik ?naar=email@adres.nl' }, { status: 400 })

  console.log('[test-mail] BREVO_SMTP_USER:', process.env.BREVO_SMTP_USER)
  console.log('[test-mail] BREVO_SMTP_PORT:', process.env.BREVO_SMTP_PORT)
  console.log('[test-mail] EMAIL_FROM:', process.env.EMAIL_FROM)

  try {
    const messageId = await verstuurMail({
      naar,
      onderwerp: 'WinkelPro — SMTP Test',
      html: `
        <div style="font-family:sans-serif;padding:20px;">
          <h2 style="color:#dc6414;">SMTP Test geslaagd! ✓</h2>
          <p>De e-mailconfiguratie van WinkelPro werkt correct.</p>
          <p><strong>Verzonden op:</strong> ${new Date().toLocaleString('nl-NL')}</p>
        </div>
      `,
    })
    return NextResponse.json({ ok: true, messageId, naar })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[test-mail] Fout:', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
