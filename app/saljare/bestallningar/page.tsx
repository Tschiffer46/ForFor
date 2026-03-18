import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ShoppingCart } from 'lucide-react'
import { OrderCard } from './order-card'

export default async function BestallningarPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const orders = await prisma.order.findMany({
    where: { sellerId: user.id },
    include: {
      customer: {
        include: {
          address: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
      campaign: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mina beställningar</h1>
        <p className="text-gray-600 mt-1">{orders.length} totalt</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Du har inga beställningar ännu.</p>
          <p className="text-sm text-gray-400 mt-2">
            Skapa din första beställning genom att klicka på &quot;Ny Order&quot; nedan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={{
                id: order.id,
                status: order.status,
                totalAmount: order.totalAmount,
                swishQrCode: order.swishQrCode,
                createdAt: order.createdAt.toISOString(),
                customer: {
                  name: order.customer.name,
                  phone: order.customer.phone,
                  email: order.customer.email,
                  address: order.customer.address.street,
                },
                items: order.items.map((item) => ({
                  id: item.id,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  discountApplied: item.discountApplied,
                  product: { name: item.product.name },
                })),
                campaign: { name: order.campaign.name },
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
