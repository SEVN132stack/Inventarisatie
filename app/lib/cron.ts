// Server-side cron — draait in de Next.js process zelf
// Wordt geïmporteerd vanuit instrumentation.ts (Next.js 14 lifecycle hook)
import cron from 'node-cron'

let gestart = false

export function startCron() {
  if (gestart) return
  gestart = true

  // Elke dag om 08:00 controleren
  cron.schedule('0 8 * * *', async () => {
    const nu = new Date()
    const dag = nu.getDate()

    // Haal ontvangers op die vandaag een rapport moeten krijgen
    try {
      const { prisma } = await import('./prisma')
      const ontvangers = await prisma.emailInstelling.findMany({ where: { actief: true, verzendDag: dag } })
      if (ontvangers.length === 0) return

      // Bereken vorige maand
      const periodeStart = new Date(nu.getFullYear(), nu.getMonth() - 1, 1).toISOString().slice(0, 10)
      const periodeEinde = new Date(nu.getFullYear(), nu.getMonth(), 0).toISOString().slice(0, 10)

      const baseUrl = process.env.NEXTAUTH_URL ?? `http://localhost:${process.env.PORT ?? 3000}`
      await fetch(`${baseUrl}/api/rapportages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'MAANDELIJKS', periodeStart, periodeEinde, stuurMail: true }),
      })
      console.log(`[cron] Maandrapportage verstuurd naar ${ontvangers.length} ontvanger(s)`)
    } catch (e) {
      console.error('[cron] Fout bij maandrapportage:', e)
    }
  }, { timezone: 'Europe/Amsterdam' })

  console.log('[cron] Rapportage scheduler gestart (dagelijks 08:00 AMS)')
}
