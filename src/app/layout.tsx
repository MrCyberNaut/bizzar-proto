import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BizzAR — Business Cards in AR',
  description: 'Point your camera at the card',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
