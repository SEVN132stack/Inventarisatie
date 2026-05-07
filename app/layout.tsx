import type { Metadata } from 'next'
import './globals.css'
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
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
