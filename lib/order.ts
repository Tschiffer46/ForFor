import { prisma } from '@/lib/prisma'
import { generateSwishQRCode, formatSwishMessage } from '@/lib/swish'

export const SUBSCRIPTION_DISCOUNT = 0.9

interface OrderItemInput {
  productId: string
  quantity: number
}

interface OrderItemData {
  productId: string
  quantity: number
  unitPrice: number
  discountApplied: boolean
}

export async function calculateOrderItems(
  items: OrderItemInput[],
  hasSubscription: boolean
): Promise<{ totalAmount: number; orderItemsData: OrderItemData[] }> {
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
  })

  let totalAmount = 0
  const orderItemsData = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)
    if (!product) throw new Error(`Produkt ${item.productId} hittades inte`)

    totalAmount += product.price * item.quantity
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.price,
      discountApplied: hasSubscription,
    }
  })

  if (hasSubscription) {
    totalAmount = Math.round(totalAmount * SUBSCRIPTION_DISCOUNT)
  }

  return { totalAmount, orderItemsData }
}

export async function generateOrderSwishQR(
  amount: number,
  clubId: string
): Promise<string | undefined> {
  const club = await prisma.club.findUnique({ where: { id: clubId } })
  return generateSwishQRCode({
    amount,
    message: formatSwishMessage(`ORDER-${Date.now()}`, club?.name || 'ForFor'),
  }).catch(() => undefined)
}
