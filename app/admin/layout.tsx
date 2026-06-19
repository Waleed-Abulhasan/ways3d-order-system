import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Ways3D — Admin',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
