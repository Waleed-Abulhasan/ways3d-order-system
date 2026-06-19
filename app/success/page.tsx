'use client'

import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { CheckCircle2, ArrowLeft } from 'lucide-react'
import { tr } from '@/lib/translations'

function SuccessContent() {
  const params = useSearchParams()
  const ref = params.get('ref') || ''
  const lang = (params.get('lang') || 'en') as 'en' | 'ar'
  const name = params.get('name') || ''
  const email = params.get('email') || ''
  const t = tr[lang]
  const isRtl = lang === 'ar'

  return (
    <div
      className="min-h-screen bg-gradient-main flex flex-col items-center justify-center px-4 py-16"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="mb-8">
        <Image src="/logo.jpg" alt="Ways3D" width={100} height={50} className="mx-auto object-contain h-12 w-auto" />
      </div>

      <div className="glass-card w-full max-w-md p-8 sm:p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-green-400" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
          {t.orderSubmitted}
        </h1>
        <p className="text-brand-text-secondary mb-6">{t.thankYou}</p>

        <div className="bg-brand-elevated border border-brand-border rounded-2xl p-5 mb-6">
          <p className="text-xs text-brand-muted uppercase tracking-wider mb-2">{t.yourRef}</p>
          <p className="text-2xl font-bold text-brand-accent font-mono tracking-widest">{ref}</p>
        </div>

        {email && (
          <p className="text-brand-text-secondary text-sm mb-8">
            {t.contactSoon}{' '}
            <span className="text-white font-medium">{email}</span>
          </p>
        )}

        <a href="/" className="btn-secondary inline-flex mx-auto">
          {isRtl ? null : <ArrowLeft size={15} />}
          {t.submitAnother}
          {isRtl ? <ArrowLeft size={15} className="rotate-180" /> : null}
        </a>
      </div>

      <div className="mt-8 text-center text-brand-muted text-xs space-y-1">
        <p>ways3dprinting@gmail.com · +966 53 557 1882</p>
        <p>Jeddah, Kingdom of Saudi Arabia</p>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bg" />}>
      <SuccessContent />
    </Suspense>
  )
}
