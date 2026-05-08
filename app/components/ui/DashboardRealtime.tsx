'use client'
import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  intervalMs?: number // standaard 30 seconden
}

// Ververst het dashboard automatisch door de server data opnieuw te laden
export default function DashboardRealtime({ intervalMs = 30000 }: Props) {
  const router = useRouter()

  const ververs = useCallback(() => {
    router.refresh() // herlaadt server component data zonder full page reload
  }, [router])

  useEffect(() => {
    const interval = setInterval(ververs, intervalMs)
    return () => clearInterval(interval)
  }, [ververs, intervalMs])

  return null // geen UI, alleen achtergrond polling
}
