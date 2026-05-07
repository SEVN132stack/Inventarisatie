import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as any
    const path = req.nextUrl.pathname

    // Sta 2fa-setup altijd toe voor ingelogde gebruikers
    if (path === '/2fa-setup') return NextResponse.next()

    // Als 2FA nog niet ingesteld is, stuur naar setup pagina
    if (token && token.twofaIngesteld === false && path !== '/2fa-setup') {
      return NextResponse.redirect(new URL('/2fa-setup', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico|logo.png).*)'],
}
