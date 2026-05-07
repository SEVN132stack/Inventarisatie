import nodemailer from 'nodemailer'

// Brevo SMTP configuratie
// SMTP sleutel formaat: xsmtpsib-...
export function maakTransporter() {
  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER, // je Brevo account e-mailadres
      pass: process.env.BREVO_SMTP_KEY,  // de SMTP sleutel (xsmtpsib-...)
    },
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

  const info = await transporter.sendMail({
    from: `"${process.env.EMAIL_NAAM ?? 'WinkelPro'}" <${process.env.EMAIL_FROM ?? 'noreply@winkel.nl'}>`,
    to: naarNaam ? `"${naarNaam}" <${naar}>` : naar,
    subject: onderwerp,
    html,
  })

  return info.messageId
}
