export { default } from 'next-auth/middleware'

export const config = {
  // Bescherm alle routes behalve login en NextAuth API
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)'],
}
