export const dynamic = 'force-dynamic'
import { prisma } from '../lib/prisma'
import InstellingenForm from './InstellingenForm'

export default async function InstellingenPage() {
  const emailInstellingen = await prisma.emailInstelling.findMany()
  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Instellingen</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>E-mail en rapportage configuratie</p>
      </div>
      <InstellingenForm emailInstellingen={emailInstellingen} />
    </div>
  )
}
