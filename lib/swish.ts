import QRCode from 'qrcode'

export interface SwishPaymentData {
  amount: number
  message: string
  payeeNumber?: string
}

export async function generateSwishQRCode(data: SwishPaymentData): Promise<string> {
  // Generate a mock Swish deep link
  // In a real app, this would follow the actual Swish API format
  const swishData = {
    version: 1,
    payee: {
      value: data.payeeNumber || '1231234567890', // Mock Swish number
    },
    amount: {
      value: data.amount,
    },
    message: {
      value: data.message,
    },
  }

  const swishUrl = `swish://payment?data=${encodeURIComponent(JSON.stringify(swishData))}`
  
  // Generate QR code as data URL
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(swishUrl, {
      width: 300,
      margin: 2,
    })
    return qrCodeDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Kunde inte generera QR-kod')
  }
}

export function formatSwishMessage(orderNumber: string, clubName: string): string {
  return `${clubName} - Order ${orderNumber}`
}
