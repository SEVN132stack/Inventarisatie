import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as any
    const path  = req.nextUrl.pathname

    // Altijd toegang tot 2fa-setup voor ingelogde gebruikers
    if (path.startsWith('/2fa-setup')) return NextResponse.next()

    // Als 2FA nog niet ingesteld: stuur naar setup
    if (token?.twofaIngesteld === false) {
      return NextResponse.redirect(new URL('/2fa-setup', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // Gebruiker moet ingelogd zijn (token aanwezig)
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/((?!login|api/auth|api/test-mail|_next/static|_next/image|favicon.ico|logo.png).*)',
  ],
}
