import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ways3D — Order Form',
  description: 'Submit your 3D printing order to Ways3D — Jeddah, Saudi Arabia.',
  icons: { icon: '/logo.jpg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
