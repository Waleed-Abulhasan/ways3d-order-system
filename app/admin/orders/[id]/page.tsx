'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import LogoImage from '@/components/LogoImage'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, Save, Printer, ExternalLink,
  Mail, Phone, Truck, Store, Calendar, User, Building2,
  FileText, MessageSquare, Video, Loader2, CheckCircle2,
  Calculator, ChevronDown, ChevronUp, Zap
} from 'lucide-react'
import { formatDate, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import type { Order, InvoiceItem } from '@/types'

const ALL_STATUSES = ['new', 'reviewing', 'in_production', 'ready', 'delivered', 'cancelled']

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [status, setStatus] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [deliveryCost, setDeliveryCost] = useState('')
  const [discount, setDiscount] = useState('')
  const [notes, setNotes] = useState('')

  // Filament calculator
  const [calcOpen, setCalcOpen] = useState(false)
  const [filamentType, setFilamentType] = useState('PLA')
  const [filamentGrams, setFilamentGrams] = useState('')
  const [printHours, setPrintHours] = useState('')
  const [printerTier, setPrinterTier] = useState('mid')
  const [marginPct, setMarginPct] = useState('30')

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then((data: Order) => {
        setOrder(data)
        setStatus(data.status)
        setItems(data.invoiceItems || [])
        setDeliveryCost(data.deliveryCost?.toString() || '')
        setDiscount(data.discount?.toString() || '')
        setNotes(data.notes || '')
        setLoading(false)
      })
  }, [id])

  const addItem = () =>
    setItems(prev => [...prev, { id: Date.now().toString(), description: '', qty: 1, unitPrice: 0 }])

  const removeItem = (itemId: string) => setItems(prev => prev.filter(i => i.id !== itemId))

  const updateItem = (itemId: string, field: keyof InvoiceItem, value: string | number) =>
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, [field]: value } : i))

  // Filament cost calculator
  const FILAMENTS: Record<string, { label: string; sarPerG: number }> = {
    PLA:   { label: 'PLA',           sarPerG: 0.037 },
    PETG:  { label: 'PETG',          sarPerG: 0.048 },
    ABS:   { label: 'ABS',           sarPerG: 0.042 },
    TPU:   { label: 'TPU (Flexible)',sarPerG: 0.070 },
    Nylon: { label: 'Nylon',         sarPerG: 0.075 },
    Resin: { label: 'Resin',         sarPerG: 0.085 },
    CF:    { label: 'Carbon Fiber',  sarPerG: 0.130 },
  }
  const PRINTERS: Record<string, { label: string; watt: number; maintPerHr: number }> = {
    budget: { label: 'Budget (Ender-level)',  watt: 120, maintPerHr: 1.5 },
    mid:    { label: 'Mid-range (Bambu-level)', watt: 180, maintPerHr: 3.0 },
    pro:    { label: 'Pro / Industrial',      watt: 350, maintPerHr: 6.0 },
  }
  const SAR_PER_KWH = 0.18
  const grams    = parseFloat(filamentGrams) || 0
  const hours    = parseFloat(printHours) || 0
  const margin   = parseFloat(marginPct) || 0
  const fil      = FILAMENTS[filamentType]
  const printer  = PRINTERS[printerTier]
  const matCost  = grams * fil.sarPerG
  const elecCost = (printer.watt / 1000) * hours * SAR_PER_KWH
  const maintCost= hours * printer.maintPerHr
  const baseCost = matCost + elecCost + maintCost
  const suggestedPrice = baseCost * (1 + margin / 100)

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0)
  const discountPct = Math.min(100, Math.max(0, parseFloat(discount) || 0))
  const discountAmount = subtotal * (discountPct / 100)
  const afterDiscount = subtotal - discountAmount
  const vatAmount = afterDiscount * 0.15
  const delivery = parseFloat(deliveryCost) || 0
  const grandTotal = afterDiscount + vatAmount + delivery

  const save = async () => {
    setSaving(true)
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        invoiceItems: items,
        deliveryCost: delivery || null,
        discount: discountAmount || null,
        notes: notes || null,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <Loader2 size={28} className="text-brand-accent animate-spin" />
    </div>
  )

  if (!order) return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center text-brand-text-secondary">
      Order not found.
    </div>
  )

  const fileUrls: string[] = Array.isArray(order.fileUrls) ? order.fileUrls : []

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-brand-surface border-b border-brand-border px-6 py-3 flex items-center gap-4">
        <Link href="/admin/dashboard" className="text-brand-text-secondary hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <LogoImage className="object-contain h-7 w-auto" />
        <span className="text-brand-muted text-sm">/</span>
        <span className="font-mono text-brand-accent text-sm font-semibold">{order.refNumber}</span>
        <span className={`status-badge ${STATUS_COLORS[status]} ms-1`}>{STATUS_LABELS[status]}</span>
        <div className="ms-auto flex items-center gap-2">
          <a
            href={`/admin/orders/${id}/invoice`}
            target="_blank"
            className="btn-secondary text-xs gap-1.5 py-2 px-4"
          >
            <Printer size={13} />
            Print Invoice
            <ExternalLink size={11} />
          </a>
          <button onClick={save} disabled={saving} className="btn-primary text-sm gap-2 py-2 px-5">
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: Order Info */}
        <div className="lg:col-span-2 space-y-4">

          {/* Customer */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-4">Customer</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User size={15} className="text-brand-muted flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">{order.firstName} {order.lastName}</p>
                  {order.orgName && <p className="text-brand-text-secondary text-xs">{order.orgName}</p>}
                </div>
                <span className={`ms-auto text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  order.customerType === 'organization'
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                }`}>
                  {order.customerType === 'organization' ? '🏢 Org' : '👤 Individual'}
                </span>
              </div>
              <a href={`mailto:${order.email}`} className="flex items-center gap-3 text-sm text-brand-text-secondary hover:text-brand-accent transition-colors">
                <Mail size={14} className="text-brand-muted" />{order.email}
              </a>
              <a href={`tel:${order.phone}`} className="flex items-center gap-3 text-sm text-brand-text-secondary hover:text-brand-accent transition-colors">
                <Phone size={14} className="text-brand-muted" />{order.phone}
              </a>
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-4">Delivery</h3>
            <div className="space-y-2 text-sm text-brand-text-secondary">
              <div className="flex items-center gap-2">
                {order.deliveryType === 'delivery' ? <Truck size={14} className="text-brand-accent" /> : <Store size={14} className="text-brand-accent" />}
                <span className="text-white font-medium capitalize">{order.deliveryType}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-brand-muted text-xs mt-0.5">📍</span>
                <span>{order.address} — {order.city}, {order.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-brand-muted" />
                <span>{order.preferredDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-brand-muted text-xs">🌐</span>
                <span>{order.language === 'ar' ? 'Arabic' : 'English'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-brand-muted text-xs">💳</span>
                <span className="capitalize font-medium text-white">
                  {order.paymentMethod === 'cash' ? '💵 Cash'
                    : order.paymentMethod === 'card_delivery' ? '💳 Card on Delivery'
                    : '🏦 Bank Transfer'}
                </span>
              </div>
            </div>
          </div>

          {/* Order Description */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">Order Description</h3>
            <p className="text-brand-text-secondary text-sm leading-relaxed whitespace-pre-wrap">{order.orderDesc}</p>
          </div>

          {/* Files */}
          {fileUrls.length > 0 && (
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">Files ({fileUrls.length})</h3>
              <div className="space-y-2">
                {fileUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    className="flex items-center gap-2 text-sm text-brand-accent hover:text-sky-300 transition-colors"
                  >
                    <FileText size={13} />
                    File {i + 1}
                    <ExternalLink size={11} className="ms-auto opacity-60" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Meeting */}
          {order.wantMeeting && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Video size={15} className="text-purple-400" />
                <h3 className="text-purple-300 font-semibold text-sm">Meeting Requested</h3>
              </div>
              {order.meetingNote && <p className="text-purple-200/70 text-sm">{order.meetingNote}</p>}
            </div>
          )}

          {/* Status */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">Order Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {ALL_STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    status === s
                      ? STATUS_COLORS[s].replace('/15', '/30')
                      : 'border-brand-border text-brand-muted bg-brand-elevated hover:border-zinc-500'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">Admin Notes</h3>
            <textarea
              rows={4}
              className="field-input resize-none text-sm"
              placeholder="Internal notes about this order..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Right: Invoice Builder */}
        <div className="lg:col-span-3">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 sticky top-20">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white font-semibold text-lg">Invoice Builder</h3>
                <p className="text-brand-muted text-xs mt-0.5">Fill in pricing — print when ready</p>
              </div>
              <span className="text-xs text-brand-muted">VAT 15% auto-calculated</span>
            </div>

            {/* Filament Cost Calculator */}
            <div className="mb-5 border border-brand-border rounded-xl overflow-hidden">
              <button
                onClick={() => setCalcOpen(o => !o)}
                className="w-full flex items-center gap-2 px-4 py-3 bg-brand-elevated hover:bg-zinc-700/50 transition-colors text-sm font-semibold text-white"
              >
                <Calculator size={14} className="text-brand-accent" />
                Filament Cost Calculator
                <span className="ms-auto text-brand-muted">{calcOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
              </button>

              {calcOpen && (
                <div className="p-4 space-y-4 border-t border-brand-border bg-brand-bg/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-brand-muted mb-1.5">Filament Type</label>
                      <select
                        className="field-input text-sm py-2 w-full"
                        value={filamentType}
                        onChange={e => setFilamentType(e.target.value)}
                      >
                        {Object.entries(FILAMENTS).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-brand-muted mb-1.5">Printer Tier</label>
                      <select
                        className="field-input text-sm py-2 w-full"
                        value={printerTier}
                        onChange={e => setPrinterTier(e.target.value)}
                      >
                        {Object.entries(PRINTERS).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-brand-muted mb-1.5">Filament Weight (g)</label>
                      <input
                        type="number" min={0} step={0.1}
                        className="field-input text-sm py-2 w-full"
                        placeholder="e.g. 85"
                        value={filamentGrams}
                        onChange={e => setFilamentGrams(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-brand-muted mb-1.5">Print Time (hours)</label>
                      <input
                        type="number" min={0} step={0.5}
                        className="field-input text-sm py-2 w-full"
                        placeholder="e.g. 4.5"
                        value={printHours}
                        onChange={e => setPrintHours(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-brand-muted mb-1.5">Profit Margin (%)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min={0} max={200} step={5}
                        className="flex-1 accent-brand-accent"
                        value={marginPct}
                        onChange={e => setMarginPct(e.target.value)}
                      />
                      <span className="text-white text-sm font-bold w-12 text-center">{marginPct}%</span>
                    </div>
                  </div>

                  {grams > 0 && hours > 0 && (
                    <div className="bg-brand-surface rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex justify-between text-brand-muted">
                        <span>Material ({grams}g × SAR {fil.sarPerG.toFixed(3)}/g)</span>
                        <span>SAR {matCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-brand-muted">
                        <span><Zap size={10} className="inline me-1" />{printer.watt}W × {hours}h × SAR {SAR_PER_KWH}/kWh</span>
                        <span>SAR {elecCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-brand-muted">
                        <span>Maintenance & wear ({hours}h × SAR {printer.maintPerHr}/h)</span>
                        <span>SAR {maintCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-brand-muted border-t border-brand-border pt-2">
                        <span>Cost base</span>
                        <span>SAR {baseCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-white font-bold text-sm pt-1">
                        <span>Suggested Price ({marginPct}% margin)</span>
                        <span className="text-brand-accent">SAR {suggestedPrice.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => {
                          const desc = `3D Print — ${fil.label}, ${grams}g, ${hours}h`
                          setItems(prev => [...prev, {
                            id: Date.now().toString(),
                            description: desc,
                            qty: 1,
                            unitPrice: Math.ceil(suggestedPrice),
                          }])
                          setCalcOpen(false)
                        }}
                        className="btn-primary w-full justify-center text-xs py-2 mt-1 gap-1.5"
                      >
                        <Plus size={12} />
                        Add SAR {Math.ceil(suggestedPrice).toFixed(2)} to Invoice
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="space-y-2 mb-4">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-brand-muted uppercase tracking-wider pb-2 border-b border-brand-border">
                <span className="col-span-6">Description</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-center">Unit Price</span>
                <span className="col-span-1 text-end">Total</span>
                <span className="col-span-1" />
              </div>
              {items.length === 0 && (
                <p className="text-center py-6 text-brand-muted text-sm">No items yet — click "Add Item" below</p>
              )}
              {items.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    className="col-span-6 field-input text-sm py-2"
                    placeholder="Item description..."
                    value={item.description}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                  />
                  <input
                    type="number"
                    min={1}
                    className="col-span-2 field-input text-sm py-2 text-center"
                    value={item.qty}
                    onChange={e => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="col-span-2 field-input text-sm py-2 text-center"
                    placeholder="0.00"
                    value={item.unitPrice || ''}
                    onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                  <span className="col-span-1 text-white text-sm font-medium text-end tabular-nums">
                    {(item.qty * item.unitPrice).toFixed(2)}
                  </span>
                  <button onClick={() => removeItem(item.id)} className="col-span-1 text-brand-muted hover:text-red-400 transition-colors flex justify-center">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={addItem} className="btn-secondary text-sm gap-2 mb-5 w-full justify-center py-2.5">
              <Plus size={14} />
              Add Item
            </button>

            {/* Delivery Cost + Discount */}
            <div className="space-y-3 mb-5 pb-5 border-b border-brand-border">
              <div className="flex items-center gap-3">
                <label className="text-sm text-brand-text-secondary flex-1">Delivery Cost (SAR)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="field-input w-36 text-sm py-2 text-center"
                  placeholder="0.00"
                  value={deliveryCost}
                  onChange={e => setDeliveryCost(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-brand-text-secondary flex-1">
                  Discount (%)
                  {discountPct > 0 && <span className="text-green-400 ms-2 text-xs">− SAR {discountAmount.toFixed(2)}</span>}
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  className="field-input w-36 text-sm py-2 text-center"
                  placeholder="0"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                />
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-brand-text-secondary">
                <span>Subtotal</span>
                <span className="tabular-nums">SAR {subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span className="tabular-nums">− SAR {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-brand-text-secondary">
                <span>VAT (15%)</span>
                <span className="tabular-nums">SAR {vatAmount.toFixed(2)}</span>
              </div>
              {delivery > 0 && (
                <div className="flex justify-between text-brand-text-secondary">
                  <span>Delivery</span>
                  <span className="tabular-nums">SAR {delivery.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-white text-base pt-3 border-t border-brand-border">
                <span>Grand Total</span>
                <span className="text-brand-accent tabular-nums">SAR {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <a
                href={`/admin/orders/${id}/invoice`}
                target="_blank"
                className="btn-secondary flex-1 text-sm gap-2 justify-center py-2.5"
              >
                <Printer size={14} />
                Preview & Print Invoice
              </a>
              <button onClick={save} disabled={saving} className="btn-primary gap-2 py-2.5 px-5 text-sm">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saved ? '✓ Saved' : 'Save'}
              </button>
            </div>

            <p className="text-center text-brand-muted text-xs mt-3">
              Save before printing so invoice reflects latest data
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
