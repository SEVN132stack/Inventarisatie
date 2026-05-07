import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:      { label: 'E-mail',     type: 'email' },
        wachtwoord: { label: 'Wachtwoord', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.wachtwoord) {
            console.log('[auth] Missende credentials')
            return null
          }

          const gebruiker = await prisma.gebruiker.findUnique({
            where: { email: credentials.email },
          })

          if (!gebruiker) {
            console.log('[auth] Gebruiker niet gevonden:', credentials.email)
            return null
          }

          if (!gebruiker.actief) {
            console.log('[auth] Gebruiker inactief:', credentials.email)
            return null
          }

          if (!gebruiker.wachtwoord) {
            console.log('[auth] Geen wachtwoord hash opgeslagen voor:', credentials.email)
            return null
          }

          const ok = await bcrypt.compare(credentials.wachtwoord, gebruiker.wachtwoord)
          console.log('[auth] Wachtwoord check voor', credentials.email, ':', ok)

          if (!ok) return null

          return {
            id:    gebruiker.id,
            name:  gebruiker.naam,
            email: gebruiker.email,
            role:  gebruiker.rol,
          }
        } catch (err) {
          console.error('[auth] Fout in authorize:', err)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id   = token.id   as string
        (session.user as any).role = token.role as string
      }
      return session
    },
  },
  pages:   { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret:  process.env.NEXTAUTH_SECRET ?? 'winkel-pro-secret-change-in-production',
  debug:   process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST }
