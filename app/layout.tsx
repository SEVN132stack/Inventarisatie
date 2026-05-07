import type { Metadata } from 'next'
import './globals.css'
import Sidebar from './components/layout/Sidebar'

export const metadata: Metadata = {
  title: 'Inventarisatie Systeem',
  description: 'Winkel voorraad- en verkoopbeheer',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', maxHeight: '100vh' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
