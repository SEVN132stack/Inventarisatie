import nodemailer from 'nodemailer'

export function maakTransporter() {
  const user = process.env.BREVO_SMTP_USER
  const pass = process.env.BREVO_SMTP_KEY

  if (!user || !pass) {
    throw new Error('SMTP niet geconfigureerd — stel BREVO_SMTP_USER en BREVO_SMTP_KEY in .env in')
  }

  const port = parseInt(process.env.BREVO_SMTP_PORT ?? '587')
  const secure = port === 465

  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  })
}

export async function verstuurMail({
  naar,
  naarNaam,
  onderwerp,
  html,
}: {
  naar: string
  naarNaam?: string
  onderwerp: string
  html: string
}) {
  const transporter = maakTransporter()
  const port = process.env.BREVO_SMTP_PORT ?? '587'
  const from = `"${process.env.EMAIL_NAAM ?? 'WinkelPro'}" <${process.env.EMAIL_FROM ?? 'noreply@winkel.nl'}>`
  const to   = naarNaam ? `"${naarNaam}" <${naar}>` : naar

  console.log(`[mail] Versturen → ${naar} via smtp-relay.brevo.com:${port}`)

  try {
    const info = await transporter.sendMail({ from, to, subject: onderwerp, html })
    console.log(`[mail] ✓ Verzonden — messageId: ${info.messageId}, response: ${info.response}`)
    return info.messageId
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[mail] ✗ Fout:`, msg)
    throw err
  }
}
