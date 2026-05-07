'use client'
import { useState } from 'react'

export default function VoorraadExportKnop() {
  const [loading, setLoading] = useState(false)

  async function download() {
    setLoading(true)
    try {
      const res = await fetch('/api/voorraad/export')
      if (!res.ok) { setLoading(false); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `voorraadlijst-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button className="btn btn-ghost" onClick={download} disabled={loading}>
      {loading ? 'Exporteren...' : '⬇ Exporteer Excel'}
    </button>
  )
}
