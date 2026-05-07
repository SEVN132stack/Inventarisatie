import type { Metadata } from 'next'
import './globals.css'
import Sidebar from './components/layout/Sidebar'
import AuthProvider from './components/providers/SessionProvider'

export const metadata: Metadata = {
  title: 'WinkelPro — Inventarisatie',
  description: 'Winkel voorraad- en verkoopbeheer',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <AuthProvider>
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', maxHeight: '100vh' }}>
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
