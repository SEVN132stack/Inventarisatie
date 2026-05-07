import speakeasy from 'speakeasy'
import { verstuurMail } from './mailer'

// Genereer een TOTP secret voor Google Authenticator
export function genereerTotpSecret(): { secret: string; otpauthUrl: string } {
  const result = speakeasy.generateSecret({
    name:   'The Fantasy Realm',
    length: 20,
  })
  return {
    secret:     result.base32,
    otpauthUrl: result.otpauth_url ?? '',
  }
}

// Verifieer een TOTP token
export function verifieerTotp(token: string, secret: string): boolean {
  try {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token:    token.replace(/\s/g, ''),
      window:   1, // tolereer 30 seconden drift
    })
  } catch {
    return false
  }
}

// Genereer een 6-cijferige e-mail OTP
export function genereerEmailOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Stuur OTP via e-mail
export async function stuurOtpMail(naar: string, naam: string, code: string): Promise<void> {
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <div style="background:#dc6414;padding:20px 28px;border-radius:10px 10px 0 0;">
        <h2 style="color:#fff;margin:0;font-size:18px;">The Fantasy Realm</h2>
        <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:12px;">Inlogverificatie</p>
      </div>
      <div style="background:#f9f9f9;padding:28px;border-radius:0 0 10px 10px;border:1px solid #eee;">
        <p style="margin:0 0 16px;color:#333;">Hallo <strong>${naam}</strong>,</p>
        <p style="margin:0 0 20px;color:#555;font-size:14px;">
          Gebruik de onderstaande code om in te loggen. Deze code is <strong>10 minuten</strong> geldig.
        </p>
        <div style="background:#fff;border:2px solid #dc6414;border-radius:8px;padding:20px;text-align:center;margin:0 0 20px;">
          <div style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#dc6414;font-family:monospace;">
            ${code}
          </div>
        </div>
        <p style="margin:0;color:#999;font-size:12px;">
          Heb je niet geprobeerd in te loggen? Neem dan contact op met de beheerder.
        </p>
      </div>
    </div>
  `
  await verstuurMail({ naar, naarNaam: naam, onderwerp: `${code} — Inlogcode The Fantasy Realm`, html })
}
