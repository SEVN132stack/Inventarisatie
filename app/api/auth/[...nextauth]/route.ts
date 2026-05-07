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
        if (!credentials?.email || !credentials?.wachtwoord) return null
        const gebruiker = await prisma.gebruiker.findUnique({
          where: { email: credentials.email },
        })
        if (!gebruiker || !gebruiker.actief) return null
        const ok = await bcrypt.compare(credentials.wachtwoord, gebruiker.wachtwoord)
        if (!ok) return null
        return { id: gebruiker.id, name: gebruiker.naam, email: gebruiker.email, role: gebruiker.rol }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = (user as any).role }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id   = token.id as string;
        (session.user as any).role = token.role as string
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET ?? 'winkel-pro-secret-change-in-production',
})

export { handler as GET, handler as POST }
