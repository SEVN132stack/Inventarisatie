import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { prisma } from './prisma'

export async function requireAuth() {
  const session = await getServerSession()
  if (!session?.user?.email) redirect('/login')
  const gebruiker = await prisma.gebruiker.findUnique({ where: { email: session.user.email } })
  if (!gebruiker || !gebruiker.actief) redirect('/login')
  return gebruiker
}

export async function requireAdmin() {
  const gebruiker = await requireAuth()
  if (gebruiker.rol !== 'ADMIN') redirect('/')
  return gebruiker
}

export async function getSession() {
  return getServerSession()
}
