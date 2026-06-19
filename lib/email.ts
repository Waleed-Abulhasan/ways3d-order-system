import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

interface OrderEmailData {
  refNumber: string
  language: string
  customerType: string
  firstName: string
  lastName: string
  orgName?: string | null
  email: string
  phone: string
  city: string
  country: string
  address: string
  orderDesc: string
  fileUrls: string[]
  wantMeeting: boolean
  meetingNote?: string | null
  deliveryType: string
  preferredDate: string
}

export async function sendOrderNotification(order: OrderEmailData) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard`
  const fileLinks =
    order.fileUrls.length > 0
      ? order.fileUrls.map((url, i) => `<a href="${url}" style="color:#0EA5E9">File ${i + 1}</a>`).join(' · ')
      : 'No files uploaded'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; background: #0a0a0a; color: #e4e4e7; margin: 0; padding: 24px; }
  .card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; max-width: 580px; margin: 0 auto; }
  .header { border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 24px; }
  .badge { display: inline-block; background: #0EA5E9; color: white; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 999px; margin-bottom: 12px; }
  h1 { margin: 0 0 4px; font-size: 22px; color: #fff; }
  .ref { font-size: 13px; color: #71717a; }
  .ref span { color: #0EA5E9; font-weight: 600; font-family: monospace; }
  .section { margin-bottom: 20px; }
  .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a; margin-bottom: 6px; }
  .value { font-size: 15px; color: #e4e4e7; }
  .desc { background: #09090b; border: 1px solid #27272a; border-radius: 8px; padding: 12px 16px; font-size: 14px; line-height: 1.6; color: #d4d4d8; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .btn { display: inline-block; background: #0EA5E9; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px; margin-top: 24px; }
  .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #27272a; font-size: 12px; color: #52525b; }
</style></head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">NEW ORDER</div>
      <h1>📦 New Order Received</h1>
      <p class="ref">Reference: <span>${order.refNumber}</span></p>
    </div>

    <div class="grid">
      <div class="section">
        <div class="label">Customer</div>
        <div class="value">${order.firstName} ${order.lastName}${order.orgName ? `<br><small style="color:#71717a">${order.orgName}</small>` : ''}</div>
      </div>
      <div class="section">
        <div class="label">Type</div>
        <div class="value">${order.customerType === 'individual' ? '👤 Individual' : '🏢 Organization'}</div>
      </div>
      <div class="section">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${order.email}" style="color:#0EA5E9">${order.email}</a></div>
      </div>
      <div class="section">
        <div class="label">Phone</div>
        <div class="value"><a href="tel:${order.phone}" style="color:#0EA5E9">${order.phone}</a></div>
      </div>
    </div>

    <div class="section">
      <div class="label">Delivery</div>
      <div class="value">${order.deliveryType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'} · ${order.city}, ${order.country}</div>
      ${order.deliveryType === 'delivery' ? `<div style="color:#71717a;font-size:13px;margin-top:4px">${order.address}</div>` : ''}
    </div>

    <div class="section">
      <div class="label">Preferred Date</div>
      <div class="value">⏱ ${order.preferredDate}</div>
    </div>

    <div class="section">
      <div class="label">Order Description</div>
      <div class="desc">${order.orderDesc.replace(/\n/g, '<br>')}</div>
    </div>

    <div class="section">
      <div class="label">Files</div>
      <div class="value">${fileLinks}</div>
    </div>

    ${order.wantMeeting ? `
    <div class="section">
      <div class="label">⚡ Meeting Requested</div>
      <div class="value">${order.meetingNote || 'No specific time noted'}</div>
    </div>` : ''}

    <a href="${dashboardUrl}" class="btn">View in Dashboard →</a>

    <div class="footer">
      Ways3D Order System · ways3dprinting@gmail.com · +966 53 557 1882
    </div>
  </div>
</body>
</html>`

  await transporter.sendMail({
    from: `"Ways3D Orders" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject: `🖨️ New Order ${order.refNumber} — ${order.firstName} ${order.lastName}`,
    html,
  })
}

export async function sendOrderConfirmation(to: string, firstName: string, refNumber: string, lang: 'en' | 'ar') {
  const isAr = lang === 'ar'
  const subject = isAr
    ? `✅ تم استلام طلبك — ${refNumber}`
    : `✅ Order Received — ${refNumber}`

  const html = `
<!DOCTYPE html>
<html dir="${isAr ? 'rtl' : 'ltr'}">
<head><meta charset="utf-8"><style>
  body { font-family: ${isAr ? "'Cairo', Tahoma," : ''} -apple-system, sans-serif; background: #0a0a0a; color: #e4e4e7; margin: 0; padding: 24px; direction: ${isAr ? 'rtl' : 'ltr'}; }
  .card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; max-width: 520px; margin: 0 auto; text-align: ${isAr ? 'right' : 'left'}; }
  h1 { color: #fff; margin: 0 0 8px; font-size: 22px; }
  .ref { font-size: 28px; font-weight: 700; color: #0EA5E9; font-family: monospace; letter-spacing: 0.05em; margin: 20px 0; text-align: center; }
  p { color: #a1a1aa; line-height: 1.6; }
  .footer { margin-top: 24px; border-top: 1px solid #27272a; padding-top: 16px; font-size: 12px; color: #52525b; }
</style></head>
<body>
  <div class="card">
    <h1>${isAr ? `مرحباً ${firstName}،` : `Hi ${firstName},`}</h1>
    <p>${isAr ? 'شكراً لاختيارك Ways3D! تم استلام طلبك بنجاح.' : 'Thank you for choosing Ways3D! Your order has been received.'}</p>
    <div class="ref">${refNumber}</div>
    <p>${isAr ? 'سيتواصل معك فريقنا خلال 24 ساعة على هذا البريد الإلكتروني أو رقم الجوال المقدم.' : 'Our team will reach out within 24 hours to your email or phone number.'}</p>
    <div class="footer">
      Ways3D · ways3dprinting@gmail.com · +966 53 557 1882<br>
      ${isAr ? 'جدة، المملكة العربية السعودية' : 'Jeddah, Kingdom of Saudi Arabia'}
    </div>
  </div>
</body>
</html>`

  await transporter.sendMail({
    from: `"Ways3D" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  })
}
