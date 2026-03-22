import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wine Link',
  description: 'Gestione contatti fiera',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}