import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM = process.env.SMTP_FROM || 'ForFor <noreply@forfor.se>'

interface OrderItem {
  name: string
  quantity: number
  unitPrice: number
}

export async function sendOrderConfirmation({
  to,
  customerName,
  clubName,
  items,
  totalAmount,
  deliveryStart,
  deliveryEnd,
}: {
  to: string
  customerName: string
  clubName: string
  items: OrderItem[]
  totalAmount: number
  deliveryStart?: string | null
  deliveryEnd?: string | null
}) {
  if (!process.env.SMTP_USER) {
    console.log('SMTP not configured, skipping email to', to)
    return
  }

  const itemRows = items
    .map(
      (item) =>
        `<tr><td style="padding:4px 8px">${item.quantity}x ${item.name}</td><td style="padding:4px 8px;text-align:right">${item.unitPrice * item.quantity} kr</td></tr>`
    )
    .join('')

  let deliveryText = ''
  if (deliveryStart && deliveryEnd) {
    deliveryText = `<p><strong>Leverans:</strong> ${formatDateSv(deliveryStart)} &ndash; ${formatDateSv(deliveryEnd)}</p>`
  } else if (deliveryStart) {
    deliveryText = `<p><strong>Leverans fr.o.m.:</strong> ${formatDateSv(deliveryStart)}</p>`
  } else if (deliveryEnd) {
    deliveryText = `<p><strong>Leverans senast:</strong> ${formatDateSv(deliveryEnd)}</p>`
  }

  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2>Tack för din beställning, ${customerName}!</h2>
      <p>Din beställning hos ${clubName} är registrerad.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead><tr style="border-bottom:1px solid #ddd"><th style="padding:4px 8px;text-align:left">Produkt</th><th style="padding:4px 8px;text-align:right">Pris</th></tr></thead>
        <tbody>${itemRows}</tbody>
        <tfoot><tr style="border-top:2px solid #333;font-weight:bold"><td style="padding:8px">Totalt</td><td style="padding:8px;text-align:right">${totalAmount} kr</td></tr></tfoot>
      </table>
      ${deliveryText}
      <p style="color:#666;font-size:13px">Tack för att du stödjer ${clubName}!</p>
      <p style="color:#999;font-size:11px">ForFor &mdash; Föreningsförsäljning</p>
    </div>
  `

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Orderbekräftelse - ${clubName}`,
    html,
  })
}

function formatDateSv(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
