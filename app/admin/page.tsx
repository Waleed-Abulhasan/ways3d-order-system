'use client'

import { useState } from 'react'
import LogoImage from '@/components/LogoImage'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    setLoading(false)
    if (result?.ok) {
      router.push('/admin/dashboard')
    } else {
      setError('Invalid email or password.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center px-4">
      <div className="glass-card w-full max-w-sm p-8 sm:p-10">
        <div className="text-center mb-8">
          <LogoImage className="mx-auto mb-4 object-contain h-11 w-auto" />
          <h1 className="text-xl font-display font-bold text-white">Admin Dashboard</h1>
          <p className="text-brand-text-secondary text-sm mt-1">Sign in to manage orders</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary mb-1.5 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
              <input
                type="email"
                required
                className="field-input pl-10"
                placeholder="admin@ways3d.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
              <input
                type="password"
                required
                className="field-input pl-10"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in...</> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
