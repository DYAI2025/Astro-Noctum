import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Celestial Orrery',
  description: '3D Solar System with Planetarium View',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
