'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Printer, Download, ArrowLeft } from 'lucide-react'
import LogoImage from '@/components/LogoImage'
import type { Order, InvoiceItem } from '@/types'
import { formatDate } from '@/lib/utils'

const BANK = {
  name: 'Alinma Bank',
  accountName: 'ABDULELAH Sales Promotion and Management',
  accountNumber: '68 2056 4270 3000',
  iban: 'SA39 0500 0068 2056 4270 3000',
  swift: 'INMASARI',
}

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then((data: Order) => { setOrder(data); setLoading(false) })
  }, [id])

  const downloadPDF = async () => {
    if (!order) return
    setGenerating(true)

    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const items: InvoiceItem[] = order.invoiceItems || []
    const delivery = order.deliveryCost || 0
    const discountPct = order.discount || 0
    const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
    const discountAmt = subtotal * (discountPct / 100)
    const afterDiscount = subtotal - discountAmt
    const vat = afterDiscount * 0.15
    const grandTotal = afterDiscount + vat + delivery
    const invoiceNumber = `INV-${order.refNumber}`

    const W = 210
    const margin = 18
    let y = 20

    // ── Helpers ────────────────────────────────────────────────────────────────
    const text = (str: string, x: number, yPos: number, opts?: object) =>
      doc.text(str, x, yPos, opts)
    const line = (y1: number) =>
      doc.line(margin, y1, W - margin, y1)
    const setFont = (style: 'normal' | 'bold', size: number, color = '#18181b') => {
      doc.setFont('helvetica', style)
      doc.setFontSize(size)
      const hex = color.replace('#', '')
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      doc.setTextColor(r, g, b)
    }
    const setFill = (hex: string) => {
      const h = hex.replace('#', '')
      doc.setFillColor(parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16))
    }
    const sar = (n: number) => `SAR ${n.toFixed(2)}`

    // Load logo and remove white JPEG background (make near-white pixels transparent)
    const loadImage = (src: string): Promise<string> =>
      new Promise(resolve => {
        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0)
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
          for (let i = 0; i < data.data.length; i += 4) {
            if (data.data[i] > 200 && data.data[i + 1] > 200 && data.data[i + 2] > 200) {
              data.data[i + 3] = 0
            }
          }
          ctx.putImageData(data, 0, 0)
          resolve(canvas.toDataURL('image/png'))
        }
        img.onerror = () => resolve('')
        img.src = src
      })

    const logoDataUrl = await loadImage('/logo-white.jpg')

    // ── Header band ────────────────────────────────────────────────────────────
    setFill('#0EA5E9')
    doc.rect(0, 0, W, 32, 'F')

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', margin, 4, 52, 26)
    } else {
      setFont('bold', 22, '#ffffff')
      text('WAYS3D', margin, 16)
    }

    setFont('normal', 9, '#ffffff')
    text('INVOICE', W - margin, 12, { align: 'right' })

    setFont('bold', 13, '#ffffff')
    text(invoiceNumber, W - margin, 20, { align: 'right' })

    setFont('normal', 8, '#dbeafe')
    text(`Date: ${formatDate(order.createdAt)}`, W - margin, 27, { align: 'right' })
    text(`Order Ref: ${order.refNumber}`, margin, 27)

    y = 44

    // ── Bill To + Delivery ─────────────────────────────────────────────────────
    // Left column — Bill To
    setFont('bold', 7, '#6b7280')
    text('BILL TO', margin, y)
    y += 5
    setFont('bold', 10, '#111827')
    text(`${order.firstName} ${order.lastName}`, margin, y)
    y += 5
    setFont('normal', 9, '#374151')
    if (order.orgName) { text(order.orgName, margin, y); y += 5 }
    if (order.deliveryType === 'delivery') {
      text(order.address, margin, y); y += 5
      text(`${order.city}, ${order.country}`, margin, y); y += 5
    }
    text(order.phone, margin, y); y += 5
    text(order.email, margin, y)

    // Right column — Delivery details
    const rx = W / 2 + 5
    let ry = 44
    setFont('bold', 7, '#6b7280')
    text('DELIVERY DETAILS', rx, ry)
    ry += 5
    setFont('normal', 9, '#374151')
    const details = [
      ['Method', order.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'],
      ['Preferred Date', order.preferredDate],
      ['Customer Type', order.customerType === 'organization' ? 'Organization' : 'Individual'],
    ]
    details.forEach(([label, val]) => {
      setFont('bold', 8, '#6b7280')
      text(`${label}:`, rx, ry)
      setFont('normal', 9, '#111827')
      text(val, rx + 30, ry)
      ry += 6
    })

    // Company info (bottom right of header area)
    setFont('normal', 7, '#9ca3af')
    const companyLines = [
      'ways3dprinting@gmail.com',
      '+966 53 557 1882',
      'Jeddah, Kingdom of Saudi Arabia',
      'ID: FL-232420334',
    ]
    let cy = 44
    companyLines.forEach(l => {
      text(l, W - margin, cy, { align: 'right' })
      cy += 4.5
    })

    // ── Divider ────────────────────────────────────────────────────────────────
    y = Math.max(y, ry) + 8
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.4)
    line(y)
    y += 6

    // ── Order description ──────────────────────────────────────────────────────
    setFill('#eff6ff')
    doc.setDrawColor(191, 219, 254)
    doc.roundedRect(margin, y, W - margin * 2, 16, 2, 2, 'FD')
    setFont('bold', 7, '#3b82f6')
    text('ORDER DESCRIPTION', margin + 4, y + 5)
    setFont('normal', 8, '#1e3a5f')
    const descLines = doc.splitTextToSize(order.orderDesc, W - margin * 2 - 8)
    const descText = descLines.slice(0, 2).join(' ')
    text(descText, margin + 4, y + 11)
    y += 22

    // ── Items table ────────────────────────────────────────────────────────────
    if (items.length > 0) {
      // Table header
      setFill('#f9fafb')
      doc.setDrawColor(229, 231, 235)
      doc.rect(margin, y, W - margin * 2, 8, 'FD')
      setFont('bold', 7, '#6b7280')
      text('#', margin + 3, y + 5.5)
      text('DESCRIPTION', margin + 10, y + 5.5)
      text('QTY', W - 65, y + 5.5, { align: 'center' })
      text('UNIT PRICE', W - 45, y + 5.5, { align: 'right' })
      text('TOTAL', W - margin, y + 5.5, { align: 'right' })
      y += 8

      items.forEach((item, i) => {
        const rowH = 9
        if (i % 2 === 0) {
          setFill('#ffffff')
        } else {
          setFill('#f9fafb')
        }
        doc.setDrawColor(243, 244, 246)
        doc.rect(margin, y, W - margin * 2, rowH, 'FD')

        setFont('normal', 8, '#9ca3af')
        text(String(i + 1), margin + 3, y + 6)
        setFont('normal', 9, '#111827')
        const descShort = doc.splitTextToSize(item.description, 90)[0]
        text(descShort, margin + 10, y + 6)
        text(String(item.qty), W - 65, y + 6, { align: 'center' })
        text(sar(item.unitPrice), W - 45, y + 6, { align: 'right' })
        setFont('bold', 9, '#111827')
        text(sar(item.qty * item.unitPrice), W - margin, y + 6, { align: 'right' })
        y += rowH
      })
      y += 4
    } else {
      setFill('#f9fafb')
      doc.setDrawColor(229, 231, 235)
      doc.roundedRect(margin, y, W - margin * 2, 12, 2, 2, 'FD')
      setFont('normal', 9, '#9ca3af')
      text('Items to be confirmed by Ways3D team', W / 2, y + 8, { align: 'center' })
      y += 18
    }

    // ── Totals ─────────────────────────────────────────────────────────────────
    const tw = 75
    const tx = W - margin - tw
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.3)

    const totalRows: [string, string, boolean?, boolean?][] = [
      ['Subtotal', sar(subtotal)],
      ...(discountPct > 0 ? [[`Discount (${discountPct}%)`, `− ${sar(discountAmt)}`, false, true] as [string, string, boolean, boolean]] : []),
      ['VAT (15%)', sar(vat)],
      ...(delivery > 0 ? [['Delivery', sar(delivery)] as [string, string]] : []),
      ['Grand Total', sar(grandTotal), true],
    ]

    totalRows.forEach(([label, value, isBold, isDiscount]) => {
      if (isBold) {
        setFill('#eff6ff')
        doc.rect(tx, y, tw, 9, 'F')
        setFont('bold', 10, '#0EA5E9')
      } else if (isDiscount) {
        setFont('normal', 9, '#16a34a')
      } else {
        setFont('normal', 9, '#6b7280')
      }
      text(label, tx + 4, y + 6)
      if (isBold) setFont('bold', 10, '#0EA5E9')
      text(value, W - margin, y + 6, { align: 'right' })
      y += 9
    })

    y += 8

    // ── Payment ────────────────────────────────────────────────────────────────
    const payLabel = order.paymentMethod === 'cash' ? 'Cash'
      : order.paymentMethod === 'card_delivery' ? 'Card on Delivery'
      : 'Bank Transfer'

    // Payment method badge
    setFill('#eff6ff')
    doc.setDrawColor(191, 219, 254)
    doc.roundedRect(margin, y, 60, 14, 2, 2, 'FD')
    setFont('bold', 7, '#6b7280')
    text('PAYMENT METHOD', margin + 4, y + 4.5)
    setFont('bold', 9, '#0EA5E9')
    text(payLabel, margin + 4, y + 11)

    // Bank details box (always shown — professional standard)
    const bx = margin + 65
    const bw = W - margin - bx
    setFill('#f0fdf4')
    doc.setDrawColor(187, 247, 208)
    doc.roundedRect(bx, y, bw, 14, 2, 2, 'FD')
    setFont('bold', 7, '#15803d')
    text('TRANSFER REFERENCE', bx + 4, y + 4.5)
    setFont('bold', 9, '#15803d')
    text(order.refNumber, bx + 4, y + 11)
    y += 18

    // Full bank card
    setFill('#f9fafb')
    doc.setDrawColor(229, 231, 235)
    doc.roundedRect(margin, y, W - margin * 2, 40, 2, 2, 'FD')

    // Left side — bank label + name
    setFont('bold', 7, '#6b7280')
    text('BANK', margin + 4, y + 5)
    setFont('bold', 10, '#111827')
    text(BANK.name, margin + 4, y + 11)
    setFont('normal', 8, '#374151')
    text(BANK.accountName, margin + 4, y + 17)

    // Right side — account number + IBAN
    const col2 = W / 2 + 4
    setFont('bold', 7, '#6b7280')
    text('ACCOUNT NUMBER', col2, y + 5)
    setFont('bold', 9, '#111827')
    text(BANK.accountNumber, col2, y + 11)
    setFont('bold', 7, '#6b7280')
    text('IBAN', col2, y + 18)
    setFont('bold', 8, '#111827')
    text(BANK.iban, col2, y + 24)
    setFont('bold', 7, '#6b7280')
    text('SWIFT / BIC', col2, y + 29)
    setFont('bold', 9, '#0EA5E9')
    text(BANK.swift, col2, y + 35)

    // Divider between columns
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.3)
    doc.line(W / 2, y + 2, W / 2, y + 38)

    y += 46

    // ── Footer ─────────────────────────────────────────────────────────────────
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.4)
    line(y)
    y += 6
    setFont('normal', 8, '#6b7280')
    text('Thank you for choosing Ways3D!', margin, y)
    setFont('normal', 8, '#9ca3af')
    text('"With Ways there is Always More than One."', W - margin, y, { align: 'right' })
    y += 5
    setFont('normal', 7, '#9ca3af')
    text(`Issued: ${formatDate(new Date())}`, margin, y)

    doc.save(`Ways3D-Invoice-${order.refNumber}.pdf`)
    setGenerating(false)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <Loader2 size={28} style={{ color: '#0EA5E9', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  if (!order) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Order not found.</div>
  )

  const items: InvoiceItem[] = order.invoiceItems || []
  const delivery = order.deliveryCost || 0
  const discountPct = order.discount || 0
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const discountAmt = subtotal * (discountPct / 100)
  const afterDiscount = subtotal - discountAmt
  const vat = afterDiscount * 0.15
  const grandTotal = afterDiscount + vat + delivery
  const invoiceNumber = `INV-${order.refNumber}`

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: #f3f4f6; }
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .invoice-page { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
          @page { margin: 12mm; size: A4; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: '#111827', borderBottom: '1px solid #374151',
        padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #374151', background: 'transparent', color: '#d1d5db', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <span style={{ color: '#6b7280', fontSize: 13 }}>Invoice Preview</span>
        <span style={{ color: '#0EA5E9', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>{invoiceNumber}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: '1px solid #374151', background: '#1f2937', color: '#d1d5db', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            <Printer size={14} /> Print
          </button>
          <button
            onClick={downloadPDF}
            disabled={generating}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: 'white', fontSize: 13, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1 }}
          >
            {generating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
            {generating ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Invoice */}
      <div style={{ paddingTop: 64, paddingBottom: 48, minHeight: '100vh' }}>
        <div ref={invoiceRef} className="invoice-page" style={{
          maxWidth: 794, margin: '0 auto', background: 'white',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)', borderRadius: 8, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ background: '#0EA5E9', padding: '28px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <LogoImage style={{ height: 72, width: 'auto', objectFit: 'contain', display: 'block', marginBottom: 10 }} />
              <div style={{ fontSize: 11, color: '#dbeafe', lineHeight: 1.7 }}>
                ways3dprinting@gmail.com<br />
                +966 53 557 1882<br />
                Jeddah, Kingdom of Saudi Arabia<br />
                ID: FL-232420334
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'white', letterSpacing: '-1px', marginBottom: 10 }}>INVOICE</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 4, fontFamily: 'monospace' }}>{invoiceNumber}</div>
              <div style={{ fontSize: 12, color: '#dbeafe', lineHeight: 1.6 }}>
                Date: {formatDate(order.createdAt)}<br />
                Order Ref: <strong style={{ color: 'white' }}>{order.refNumber}</strong>
              </div>
            </div>
          </div>

          <div style={{ padding: '32px 40px' }}>
            {/* Bill To + Delivery */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 28 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: 8 }}>Bill To</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{order.firstName} {order.lastName}</div>
                {order.orgName && <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 2 }}>{order.orgName}</div>}
                {order.deliveryType === 'delivery' && (
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 2 }}>
                    {order.address}<br />{order.city}, {order.country}
                  </div>
                )}
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                  {order.phone}<br />{order.email}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: 8 }}>Delivery Details</div>
                {[
                  ['Method', order.deliveryType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'],
                  ['Preferred Date', order.preferredDate],
                  ['Customer Type', order.customerType === 'organization' ? 'Organization' : 'Individual'],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 13 }}>
                    <span style={{ color: '#9ca3af', minWidth: 90 }}>{label}</span>
                    <span style={{ color: '#111827', fontWeight: 500 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Description */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3b82f6', marginBottom: 4 }}>Order Description</div>
              <p style={{ fontSize: 13, color: '#1e3a5f', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{order.orderDesc}</p>
            </div>

            {/* Items Table */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['#', 'Description', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                      <th key={h} style={{
                        padding: '10px 14px', fontSize: 11, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                        color: '#6b7280', borderBottom: '2px solid #e5e7eb',
                        textAlign: i === 0 ? 'center' : i >= 2 ? 'right' : 'left',
                        width: i === 0 ? 36 : i === 1 ? 'auto' : 90,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                        Items to be confirmed by Ways3D team
                      </td>
                    </tr>
                  ) : items.map((item, i) => (
                    <tr key={item.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '11px 14px', textAlign: 'center', color: '#9ca3af', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>{i + 1}</td>
                      <td style={{ padding: '11px 14px', fontSize: 14, color: '#111827', borderBottom: '1px solid #f3f4f6' }}>{item.description}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6', fontVariantNumeric: 'tabular-nums' }}>{item.qty}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6', fontVariantNumeric: 'tabular-nums' }}>SAR {item.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#111827', borderBottom: '1px solid #f3f4f6', fontVariantNumeric: 'tabular-nums' }}>SAR {(item.qty * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, marginBottom: 24 }}>
              <div style={{ width: 260 }}>
                {[
                  { label: 'Subtotal', val: subtotal, color: '#6b7280' },
                  ...(discountPct > 0 ? [{ label: `Discount (${discountPct}%)`, val: -discountAmt, color: '#16a34a' }] : []),
                  { label: 'VAT (15%)', val: vat, color: '#6b7280' },
                  ...(delivery > 0 ? [{ label: 'Delivery', val: delivery, color: '#6b7280' }] : []),
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, color, borderBottom: '1px solid #f3f4f6' }}>
                    <span>{label}</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{val < 0 ? `− SAR ${Math.abs(val).toFixed(2)}` : `SAR ${val.toFixed(2)}`}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', marginTop: 4, background: '#eff6ff', borderRadius: 8, fontSize: 16, fontWeight: 700, color: '#0EA5E9' }}>
                  <span>Grand Total</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>SAR {grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment */}
            {(() => {
              const payLabel = order.paymentMethod === 'cash' ? '💵 Cash'
                : order.paymentMethod === 'card_delivery' ? '💳 Card on Delivery'
                : '🏦 Bank Transfer'
              return (
                <div style={{ marginBottom: 20 }}>
                  {/* Method + Reference row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: 4 }}>Payment Method</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#0EA5E9' }}>{payLabel}</div>
                    </div>
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: 4 }}>Transfer Reference</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d', fontFamily: 'monospace' }}>{order.refNumber}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Use as payment reference</div>
                    </div>
                  </div>

                  {/* Bank card — always shown */}
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ background: '#f9fafb', padding: '8px 16px', borderBottom: '1px solid #e5e7eb' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>Bank Transfer Details</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: 'none' }}>
                      <div style={{ padding: '14px 18px', borderRight: '1px solid #f3f4f6' }}>
                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bank</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{BANK.name}</div>
                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account Name</div>
                        <div style={{ fontSize: 13, color: '#374151' }}>{BANK.accountName}</div>
                      </div>
                      <div style={{ padding: '14px 18px' }}>
                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account Number</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: 'monospace', marginBottom: 10 }}>{BANK.accountNumber}</div>
                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>IBAN</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', fontFamily: 'monospace', marginBottom: 10 }}>{BANK.iban}</div>
                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>SWIFT / BIC</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>{BANK.swift}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {order.notes && (
              <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '14px 18px', marginBottom: 28 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#92400e', marginBottom: 4 }}>Notes</div>
                <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>{order.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>
                <div>Thank you for choosing Ways3D!</div>
                <div style={{ marginTop: 3 }}>Issued: {formatDate(new Date())}</div>
              </div>
              <div style={{ fontSize: 12, fontStyle: 'italic', color: '#6b7280' }}>
                "With Ways there is Always More than One."
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
