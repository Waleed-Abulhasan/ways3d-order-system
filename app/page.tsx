'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { tr, type Lang } from '@/lib/translations'
import { cn } from '@/lib/utils'
import type { FormData, CustomerType, DeliveryType } from '@/types'
import {
  CheckCircle2, ChevronRight, ChevronLeft, Upload, X, Loader2,
  User, Building2, Truck, Store, FileText, Calendar,
  Phone, Mail, MapPin, Video,
} from 'lucide-react'

const INITIAL_FORM: FormData = {
  language: 'en',
  customerType: '',
  firstName: '',
  lastName: '',
  orgName: '',
  email: '',
  phone: '',
  orderDesc: '',
  files: [],
  fileUrls: [],
  wantMeeting: false,
  meetingNote: '',
  deliveryType: '',
  city: '',
  country: '',
  address: '',
  preferredDate: '',
  paymentMethod: '',
  agreedToTerms: false,
}

const INDIVIDUAL_DATES = ['date2', 'date3', 'date4', 'date5', 'date6', 'date7'] as const
const ORG_DATES = ['dateW1', 'dateW2', 'dateW3', 'dateM1', 'dateM1plus'] as const

export default function OrderFormPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | 'global', string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)


  const t = tr[form.language]
  const isRtl = form.language === 'ar'
  const isOrg = form.customerType === 'organization'

  const set = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }, [])

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
    fd.append('resource_type', 'auto')
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
      { method: 'POST', body: fd }
    )
    const data = await res.json()
    if (!data.secure_url) throw new Error('Upload failed')
    return data.secure_url as string
  }

  const handleFiles = async (incoming: FileList | null) => {
    if (!incoming) return
    const newFiles = Array.from(incoming)
    setForm(prev => ({ ...prev, files: [...prev.files, ...newFiles] }))
    for (const file of newFiles) {
      setUploadingFiles(prev => [...prev, file.name])
      try {
        const url = await uploadToCloudinary(file)
        setForm(prev => ({ ...prev, fileUrls: [...prev.fileUrls, url] }))
      } catch {
        // file stays listed; URL won't exist
      } finally {
        setUploadingFiles(prev => prev.filter(n => n !== file.name))
      }
    }
  }

  const removeFile = (index: number) => {
    setForm(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
      fileUrls: prev.fileUrls.filter((_, i) => i !== index),
    }))
  }

  const validateStep = (): boolean => {
    const errs: typeof errors = {}
    if (step === 0) {
      if (!form.customerType) errs.customerType = t.selectType
    }
    if (step === 1) {
      if (!form.firstName.trim()) errs.firstName = t.required
      if (!form.lastName.trim()) errs.lastName = t.required
      if (isOrg && !form.orgName.trim()) errs.orgName = t.required
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = t.required
      if (!form.phone.trim()) errs.phone = t.required
    }
    if (step === 2) {
      if (!form.orderDesc.trim()) errs.orderDesc = t.required
    }
    if (step === 3) {
      if (!form.deliveryType) errs.deliveryType = t.selectDelivery
      if (form.deliveryType === 'delivery') {
        if (!form.city.trim()) errs.city = t.required
        if (!form.country.trim()) errs.country = t.required
        if (!form.address.trim()) errs.address = t.required
      }
      if (!form.preferredDate) errs.preferredDate = t.selectDate
      if (!isOrg && !form.paymentMethod) errs.paymentMethod = t.selectPayment
    }
    if (step === 4) {
      if (!form.agreedToTerms) errs.agreedToTerms = t.agreeTerms
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const goNext = () => { if (validateStep()) setStep(s => Math.min(s + 1, 4)) }
  const goBack = () => setStep(s => Math.max(s - 1, 0))

  const handleSubmit = async () => {
    if (!validateStep()) return
    setIsSubmitting(true)
    try {
      const payload = {
        language: form.language,
        customerType: form.customerType,
        firstName: form.firstName,
        lastName: form.lastName,
        orgName: form.orgName || null,
        email: form.email,
        phone: form.phone,
        orderDesc: form.orderDesc,
        fileUrls: form.fileUrls,
        wantMeeting: form.wantMeeting,
        meetingNote: form.meetingNote || null,
        deliveryType: form.deliveryType,
        city: form.city || 'Jeddah (Pickup)',
        country: form.country || 'Saudi Arabia',
        address: form.address || 'Pickup from Ways3D Jeddah',
        preferredDate: form.preferredDate,
        paymentMethod: isOrg ? 'transfer' : form.paymentMethod,
      }
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      router.push(`/success?ref=${data.refNumber}&lang=${form.language}&name=${encodeURIComponent(form.firstName)}&email=${encodeURIComponent(form.email)}`)
    } catch {
      setErrors({ global: 'Something went wrong. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const dateKeys = isOrg ? ORG_DATES : INDIVIDUAL_DATES

  return (
    <div
      className="min-h-screen bg-gradient-main flex flex-col items-center justify-start px-4 pt-10 pb-16"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Logo */}
      <div className="mb-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-dark-bg.jpg"
          alt="Ways3D"
          className="mx-auto mb-3 object-contain h-14 w-auto"
        />
        <p className="text-brand-text-secondary text-xs tracking-widest uppercase">{t.tagline}</p>
      </div>

      {/* Card */}
      <div className="glass-card w-full max-w-xl p-7 sm:p-9">

        {/* Progress bar */}
        <div className="flex items-center justify-center gap-1 mb-8 flex-wrap">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-1">
              <button
                onClick={() => i < step && setStep(i)}
                className={cn(
                  'step-dot',
                  i === step ? 'active' : i < step ? 'complete' : 'inactive',
                  i < step && 'cursor-pointer hover:scale-110'
                )}
              >
                {i < step ? <CheckCircle2 size={14} /> : i + 1}
              </button>
              {i < 4 && (
                <div className={cn(
                  'h-0.5 w-6 sm:w-10 transition-all duration-300',
                  i < step ? 'bg-brand-accent' : 'bg-brand-border'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 0: Language & Type ── */}
        {step === 0 && (
          <div className="animate-step">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-1">{t.chooseLanguage}</h2>
            <p className="text-brand-text-secondary mb-8 text-sm">Ways3D — Jeddah, KSA</p>
            <div className="grid grid-cols-2 gap-3 mb-10">
              {(['en', 'ar'] as Lang[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => {
                    set('language', lang)
                    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr'
                  }}
                  className={cn('select-card py-6', form.language === lang && 'selected')}
                >
                  <span className="text-3xl">{lang === 'en' ? '🇺🇸' : '🇸🇦'}</span>
                  <span className="text-white font-semibold">{lang === 'en' ? 'English' : 'العربية'}</span>
                </button>
              ))}
            </div>
            <h3 className="text-lg font-semibold text-white mb-4">{t.whoAreYou}</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => set('customerType', 'individual' as CustomerType)}
                className={cn('select-card py-7', form.customerType === 'individual' && 'selected')}
              >
                <User size={28} className={form.customerType === 'individual' ? 'text-brand-accent' : 'text-brand-muted'} />
                <span className="text-white font-semibold">{t.individual}</span>
                <span className="text-brand-text-secondary text-xs">{t.individualDesc}</span>
              </button>
              <button
                onClick={() => set('customerType', 'organization' as CustomerType)}
                className={cn('select-card py-7', form.customerType === 'organization' && 'selected')}
              >
                <Building2 size={28} className={form.customerType === 'organization' ? 'text-brand-accent' : 'text-brand-muted'} />
                <span className="text-white font-semibold">{t.organization}</span>
                <span className="text-brand-text-secondary text-xs">{t.organizationDesc}</span>
              </button>
            </div>
            {errors.customerType && <p className="mt-2 text-red-400 text-xs text-center">{errors.customerType}</p>}
          </div>
        )}

        {/* ── Step 1: Personal Info ── */}
        {step === 1 && (
          <div className="animate-step">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-6">{t.yourInfo}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-text-secondary mb-1.5 uppercase tracking-wider">{t.firstName}</label>
                  <input
                    className="field-input"
                    placeholder={t.firstNamePlaceholder}
                    value={form.firstName}
                    onChange={e => set('firstName', e.target.value)}
                  />
                  {errors.firstName && <p className="mt-1 text-red-400 text-xs">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-text-secondary mb-1.5 uppercase tracking-wider">{t.lastName}</label>
                  <input
                    className="field-input"
                    placeholder={t.lastNamePlaceholder}
                    value={form.lastName}
                    onChange={e => set('lastName', e.target.value)}
                  />
                  {errors.lastName && <p className="mt-1 text-red-400 text-xs">{errors.lastName}</p>}
                </div>
              </div>
              {isOrg && (
                <div>
                  <label className="block text-xs font-semibold text-brand-text-secondary mb-1.5 uppercase tracking-wider">{t.orgName}</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
                    <input
                      className="field-input ps-10"
                      placeholder={t.orgNamePlaceholder}
                      value={form.orgName}
                      onChange={e => set('orgName', e.target.value)}
                    />
                  </div>
                  {errors.orgName && <p className="mt-1 text-red-400 text-xs">{errors.orgName}</p>}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary mb-1.5 uppercase tracking-wider">{t.email}</label>
                <div className="relative">
                  <Mail size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
                  <input
                    type="email"
                    className="field-input ps-10"
                    placeholder={t.emailPlaceholder}
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                  />
                </div>
                {errors.email && <p className="mt-1 text-red-400 text-xs">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary mb-1.5 uppercase tracking-wider">{t.phone}</label>
                <div className="relative">
                  <Phone size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
                  <input
                    type="tel"
                    className="field-input ps-10"
                    placeholder={t.phonePlaceholder}
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-red-400 text-xs">{errors.phone}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Order Details ── */}
        {step === 2 && (
          <div className="animate-step">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-6">{t.orderDetails}</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary mb-1.5 uppercase tracking-wider">{t.whatToPrint}</label>
                <textarea
                  rows={5}
                  className="field-input resize-none leading-relaxed"
                  placeholder={t.descPlaceholder}
                  value={form.orderDesc}
                  onChange={e => set('orderDesc', e.target.value)}
                />
                {errors.orderDesc && <p className="mt-1 text-red-400 text-xs">{errors.orderDesc}</p>}
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary mb-1.5 uppercase tracking-wider">{t.uploadFiles}</label>
                <div
                  className={cn('upload-zone', dragging && 'dragging')}
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={28} className="text-brand-muted mx-auto mb-3" />
                  <p className="text-white font-medium text-sm">{t.uploadDrag}</p>
                  <p className="text-brand-muted text-xs mt-1">{t.uploadFormats}</p>
                  <p className="text-brand-muted text-xs mt-0.5 opacity-60">{t.uploadOptional}</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".stl,.obj,.3mf,.step,.stp,.iges,.igs,.f3d,.pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={e => handleFiles(e.target.files)}
                  />
                </div>
                {form.files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {form.files.map((file, i) => (
                      <div key={i} className="flex items-center gap-3 bg-brand-elevated border border-brand-border rounded-xl px-3 py-2.5">
                        <FileText size={16} className="text-brand-accent flex-shrink-0" />
                        <span className="flex-1 text-sm text-white truncate">{file.name}</span>
                        {uploadingFiles.includes(file.name)
                          ? <Loader2 size={14} className="text-brand-accent animate-spin" />
                          : form.fileUrls[i] ? <CheckCircle2 size={14} className="text-green-400" /> : null}
                        <button onClick={() => removeFile(i)} className="text-brand-muted hover:text-red-400 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Meeting */}
              <div className="bg-brand-elevated border border-brand-border rounded-2xl p-4">
                <button
                  type="button"
                  onClick={() => set('wantMeeting', !form.wantMeeting)}
                  className="flex items-center gap-3 w-full text-start"
                >
                  <div className={cn('custom-checkbox', form.wantMeeting && 'checked')}>
                    {form.wantMeeting && <CheckCircle2 size={12} className="text-white mx-auto mt-0.5" />}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{t.meetingTitle}</p>
                    <p className="text-brand-text-secondary text-xs mt-0.5">{t.meetingDesc}</p>
                  </div>
                  <Video size={18} className={cn('ms-auto flex-shrink-0', form.wantMeeting ? 'text-brand-accent' : 'text-brand-muted')} />
                </button>
                {form.wantMeeting && (
                  <div className="mt-3 pt-3 border-t border-brand-border">
                    <label className="block text-xs font-semibold text-brand-text-secondary mb-1.5 uppercase tracking-wider">{t.meetingNote}</label>
                    <input
                      className="field-input"
                      placeholder={t.meetingNotePlaceholder}
                      value={form.meetingNote}
                      onChange={e => set('meetingNote', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Delivery ── */}
        {step === 3 && (
          <div className="animate-step">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">{t.deliveryPrefs}</h2>
            <p className="text-brand-text-secondary text-sm mb-6">{t.howReceive}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => { set('deliveryType', 'delivery' as DeliveryType); set('country', t.countryDefault) }}
                className={cn('select-card py-6', form.deliveryType === 'delivery' && 'selected')}
              >
                <Truck size={26} className={form.deliveryType === 'delivery' ? 'text-brand-accent' : 'text-brand-muted'} />
                <span className="text-white font-semibold">{t.delivery}</span>
                <span className="text-brand-text-secondary text-xs">{t.deliveryDesc}</span>
              </button>
              <button
                onClick={() => set('deliveryType', 'pickup' as DeliveryType)}
                className={cn('select-card py-6', form.deliveryType === 'pickup' && 'selected')}
              >
                <Store size={26} className={form.deliveryType === 'pickup' ? 'text-brand-accent' : 'text-brand-muted'} />
                <span className="text-white font-semibold">{t.pickup}</span>
                <span className="text-brand-text-secondary text-xs">{t.pickupDesc}</span>
              </button>
            </div>
            {errors.deliveryType && <p className="mb-4 text-red-400 text-xs text-center">{errors.deliveryType}</p>}

            {form.deliveryType === 'delivery' && (
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brand-text-secondary mb-1.5 uppercase tracking-wider">{t.city}</label>
                    <input
                      className="field-input"
                      placeholder={t.cityPlaceholder}
                      value={form.city}
                      onChange={e => set('city', e.target.value)}
                    />
                    {errors.city && <p className="mt-1 text-red-400 text-xs">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-text-secondary mb-1.5 uppercase tracking-wider">{t.country}</label>
                    <input
                      className="field-input"
                      placeholder={t.countryDefault}
                      value={form.country}
                      onChange={e => set('country', e.target.value)}
                    />
                    {errors.country && <p className="mt-1 text-red-400 text-xs">{errors.country}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-text-secondary mb-1.5 uppercase tracking-wider">{t.address}</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute start-3.5 top-3.5 text-brand-muted pointer-events-none" />
                    <textarea
                      rows={2}
                      className="field-input ps-10 resize-none"
                      placeholder={t.addressPlaceholder}
                      value={form.address}
                      onChange={e => set('address', e.target.value)}
                    />
                  </div>
                  {errors.address && <p className="mt-1 text-red-400 text-xs">{errors.address}</p>}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary mb-2 uppercase tracking-wider">
                <Calendar size={12} className="inline me-1" />{t.whenNeed}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {dateKeys.map(key => {
                  const label = t[key as keyof typeof t] as string
                  return (
                    <button
                      key={key}
                      onClick={() => set('preferredDate', label)}
                      className={cn(
                        'py-2.5 px-3 rounded-xl border text-sm font-medium transition-all duration-150',
                        form.preferredDate === label
                          ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                          : 'border-brand-border bg-brand-elevated text-brand-text-secondary hover:border-zinc-500 hover:text-white'
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              {errors.preferredDate && <p className="mt-2 text-red-400 text-xs">{errors.preferredDate}</p>}
            </div>

            {/* Payment Method */}
            <div className="mt-5">
              <label className="block text-xs font-semibold text-brand-text-secondary mb-2 uppercase tracking-wider">
                {t.paymentMethod}
              </label>
              {isOrg ? (
                <div className={cn('select-card py-4 cursor-default selected')}>
                  <span className="text-2xl">🏦</span>
                  <span className="text-white font-semibold">{t.transferOnly}</span>
                  <span className="text-brand-text-secondary text-xs">{t.transferOnlyDesc}</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'cash', icon: '💵', label: t.cash, desc: t.cashDesc },
                    { key: 'card_delivery', icon: '💳', label: t.cardDelivery, desc: t.cardDeliveryDesc },
                    { key: 'transfer', icon: '🏦', label: t.bankTransfer, desc: t.bankTransferDesc },
                  ].map(({ key, icon, label, desc }) => (
                    <button
                      key={key}
                      onClick={() => set('paymentMethod', key)}
                      className={cn('select-card py-5', form.paymentMethod === key && 'selected')}
                    >
                      <span className="text-2xl">{icon}</span>
                      <span className="text-white font-semibold text-sm">{label}</span>
                      <span className="text-brand-text-secondary text-xs leading-tight">{desc}</span>
                    </button>
                  ))}
                </div>
              )}
              {errors.paymentMethod && <p className="mt-2 text-red-400 text-xs">{errors.paymentMethod}</p>}
            </div>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <div className="animate-step">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-1">{t.reviewOrder}</h2>
            <p className="text-brand-text-secondary text-sm mb-6">{t.reviewSubtitle}</p>

            <div className="bg-brand-elevated border border-brand-border rounded-2xl px-4 mb-5">
              {[
                { label: t.name, value: `${form.firstName} ${form.lastName}`, icon: <User size={14} /> },
                ...(form.orgName ? [{ label: t.orgLabel, value: form.orgName, icon: <Building2 size={14} /> }] : []),
                { label: t.emailLabel, value: form.email, icon: <Mail size={14} /> },
                { label: t.phoneLabel, value: form.phone, icon: <Phone size={14} /> },
                {
                  label: t.deliveryMethod,
                  value: form.deliveryType === 'delivery' ? `🚚 ${t.delivery}` : `🏪 ${t.pickup}`,
                  icon: <Truck size={14} />,
                },
                ...(form.deliveryType === 'delivery'
                  ? [{ label: t.deliveryAddress, value: `${form.address}, ${form.city}, ${form.country}`, icon: <MapPin size={14} /> }]
                  : []),
                { label: t.preferredDateLabel, value: form.preferredDate, icon: <Calendar size={14} /> },
                { label: t.meetingConsult, value: form.wantMeeting ? t.requested : t.notRequested, icon: <Video size={14} /> },
                {
                  label: t.paymentMethod,
                  value: isOrg ? `🏦 ${t.transferOnly}` : form.paymentMethod === 'cash' ? `💵 ${t.cash}` : form.paymentMethod === 'card_delivery' ? `💳 ${t.cardDelivery}` : `🏦 ${t.bankTransfer}`,
                  icon: <span className="text-xs">💳</span>,
                },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex items-start gap-3 py-3 border-b border-brand-border last:border-0">
                  <div className="text-brand-muted mt-0.5 flex-shrink-0">{icon}</div>
                  <div>
                    <p className="text-xs text-brand-muted uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-white text-sm leading-relaxed">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-brand-elevated border border-brand-border rounded-2xl px-4 py-3 mb-5">
              <p className="text-xs text-brand-muted uppercase tracking-wider mb-2">{t.orderDesc}</p>
              <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{form.orderDesc}</p>
              {form.files.length > 0 && (
                <div className="mt-3 pt-3 border-t border-brand-border">
                  <p className="text-xs text-brand-muted uppercase tracking-wider mb-2">{t.uploadedFiles}</p>
                  {form.files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-brand-text-secondary">
                      <CheckCircle2 size={12} className={form.fileUrls[i] ? 'text-green-400' : 'text-brand-muted'} />
                      {f.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Terms */}
            <button
              type="button"
              onClick={() => set('agreedToTerms', !form.agreedToTerms)}
              className="flex items-start gap-3 w-full text-start bg-brand-elevated border border-brand-border rounded-2xl p-4 hover:border-zinc-600 transition-colors"
            >
              <div className={cn('custom-checkbox mt-0.5', form.agreedToTerms && 'checked')}>
                {form.agreedToTerms && <CheckCircle2 size={12} className="text-white mx-auto mt-0.5" />}
              </div>
              <p className="text-brand-text-secondary text-sm leading-relaxed">{t.terms}</p>
            </button>
            {errors.agreedToTerms && <p className="mt-2 text-red-400 text-xs">{errors.agreedToTerms}</p>}
            {errors.global && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                {errors.global}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className={cn('flex gap-3 mt-8', step === 0 ? 'justify-end' : 'justify-between')}>
          {step > 0 && (
            <button onClick={goBack} className="btn-secondary">
              {isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              {t.back}
            </button>
          )}
          {step < 4 ? (
            <button onClick={goNext} className="btn-primary ms-auto">
              {t.next}
              {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || uploadingFiles.length > 0}
              className="btn-primary ms-auto min-w-[160px]"
            >
              {isSubmitting
                ? <><Loader2 size={16} className="animate-spin" />{t.submitting}</>
                : <>{t.submit} <CheckCircle2 size={16} /></>}
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-brand-muted text-xs space-y-1">
        <p>ways3dprinting@gmail.com · +966 53 557 1882</p>
        <p>Jeddah, Kingdom of Saudi Arabia · FL-232420334</p>
      </div>
    </div>
  )
}
