import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Takeoff - Level Up Your Life',
  description: 'An RPG-style productivity system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
