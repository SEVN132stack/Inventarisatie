export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startCron } = await import('./app/lib/cron')
    startCron()
  }
}
