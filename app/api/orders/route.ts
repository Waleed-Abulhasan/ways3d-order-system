import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendOrderNotification, sendOrderConfirmation } from '@/lib/email'
import { generateRefNumber } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      language, customerType, firstName, lastName, orgName,
      email, phone, orderDesc, fileUrls, wantMeeting, meetingNote,
      deliveryType, city, country, address, preferredDate, paymentMethod,
    } = body

    if (!firstName || !lastName || !email || !phone || !orderDesc || !deliveryType || !preferredDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const refNumber = generateRefNumber()

    const order = await db.order.create({
      data: {
        refNumber,
        language: language || 'en',
        customerType: customerType || 'individual',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        orgName: orgName?.trim() || null,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        orderDesc: orderDesc.trim(),
        fileUrls: JSON.stringify(fileUrls || []),
        wantMeeting: wantMeeting || false,
        meetingNote: meetingNote?.trim() || null,
        deliveryType,
        city: city?.trim() || '',
        country: country?.trim() || 'Saudi Arabia',
        address: address?.trim() || '',
        preferredDate,
        paymentMethod: paymentMethod || 'transfer',
        status: 'new',
      },
    })

    // Send emails (non-blocking — don't let email failures fail the order)
    const emailPayload = {
      refNumber,
      language,
      customerType,
      firstName,
      lastName,
      orgName,
      email,
      phone,
      city,
      country,
      address,
      orderDesc,
      fileUrls: fileUrls || [],
      wantMeeting: wantMeeting || false,
      meetingNote,
      deliveryType,
      preferredDate,
    }

    Promise.all([
      sendOrderNotification(emailPayload),
      sendOrderConfirmation(email, firstName, refNumber, language || 'en'),
    ]).catch(err => console.error('Email send error:', err))

    return NextResponse.json({ refNumber, id: order.id }, { status: 201 })
  } catch (err) {
    console.error('Order creation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const q = searchParams.get('q')

  const orders = await db.order.findMany({
    where: {
      ...(status && status !== 'all' ? { status } : {}),
      ...(q ? {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { email: { contains: q } },
          { refNumber: { contains: q } },
        ],
      } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(orders)
}
