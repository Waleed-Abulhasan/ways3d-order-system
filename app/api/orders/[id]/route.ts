import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { InvoiceItem } from '@/types'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const order = await db.order.findUnique({ where: { id: params.id } })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    ...order,
    fileUrls: JSON.parse(order.fileUrls || '[]'),
    invoiceItems: order.invoiceItems ? JSON.parse(order.invoiceItems) : null,
  })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.order.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Order delete error:', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { status, invoiceItems, deliveryCost, discount, notes, invoiceNumber } = body

    const updated = await db.order.update({
      where: { id: params.id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(invoiceItems !== undefined ? { invoiceItems: JSON.stringify(invoiceItems) } : {}),
        ...(deliveryCost !== undefined ? { deliveryCost: deliveryCost || null } : {}),
        ...(discount !== undefined ? { discount: discount || null } : {}),
        ...(notes !== undefined ? { notes: notes || null } : {}),
        ...(invoiceNumber !== undefined ? { invoiceNumber } : {}),
      },
    })

    return NextResponse.json({
      ...updated,
      fileUrls: JSON.parse(updated.fileUrls || '[]'),
      invoiceItems: updated.invoiceItems ? JSON.parse(updated.invoiceItems) : null,
    })
  } catch (err) {
    console.error('Order update error:', err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
