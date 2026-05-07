import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:      { label: 'E-mail',     type: 'email'    },
        wachtwoord: { label: 'Wachtwoord', type: 'password' },
        twofaCode:  { label: '2FA Code',   type: 'text'     },
        twofaSkip:  { label: '2FA Skip',   type: 'text'     }, // 'true' = eerste login
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.wachtwoord) return null

          const gebruiker = await prisma.gebruiker.findUnique({ where: { email: credentials.email } })
          if (!gebruiker || !gebruiker.actief || !gebruiker.wachtwoord) return null

          const ok = await bcrypt.compare(credentials.wachtwoord, gebruiker.wachtwoord)
          if (!ok) return null

          // Eerste keer inloggen (2FA nog niet ingesteld) → doorlaten
          if (!gebruiker.twofaIngesteld) {
            console.log('[auth] Eerste login voor', credentials.email, '— 2FA nog niet ingesteld')
            return {
              id:             gebruiker.id,
              name:           gebruiker.naam,
              email:          gebruiker.email,
              role:           gebruiker.rol,
              twofaIngesteld: false,
            }
          }

          // 2FA verplicht — controleer de code
          const code = credentials.twofaCode?.trim()
          if (!code) {
            // Geen code meegestuurd → geef aan dat 2FA nodig is via speciale error
            console.log('[auth] 2FA vereist voor', credentials.email)
            throw new Error('2FA_REQUIRED:' + gebruiker.twofaMethode)
          }

          // Verifieer de code
          const methode = gebruiker.twofaMethode ?? 'totp'
          let geldig = false

          if (methode === 'totp' && gebruiker.twofaSecret) {
            const { verifieerTotp } = await import('../../../lib/twofa')
            geldig = verifieerTotp(code, gebruiker.twofaSecret)
          } else if (methode === 'email') {
            const nu = new Date()
            geldig = !!(
              gebruiker.twofaEmailCode === code &&
              gebruiker.twofaCodeVerval &&
              gebruiker.twofaCodeVerval > nu
            )
            if (geldig) {
              await prisma.gebruiker.update({
                where: { id: gebruiker.id },
                data: { twofaEmailCode: null, twofaCodeVerval: null },
              })
            }
          }

          if (!geldig) {
            console.log('[auth] Ongeldige 2FA code voor', credentials.email)
            throw new Error('2FA_INVALID')
          }

          return {
            id:             gebruiker.id,
            name:           gebruiker.naam,
            email:          gebruiker.email,
            role:           gebruiker.rol,
            twofaIngesteld: true,
          }
        } catch (err) {
          // Re-throw specifieke 2FA errors zodat loginpagina ze kan afhandelen
          if (err instanceof Error && (err.message.startsWith('2FA_') )) {
            throw err
          }
          console.error('[auth] Fout:', err)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id             = user.id
        token.role           = (user as any).role
        token.twofaIngesteld = (user as any).twofaIngesteld
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id             = token.id             as string
        (session.user as any).role           = token.role           as string
        (session.user as any).twofaIngesteld = token.twofaIngesteld as boolean
      }
      return session
    },
  },
  pages:   { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret:  process.env.NEXTAUTH_SECRET ?? 'winkel-pro-secret-change-in-production',
})

export { handler as GET, handler as POST }
