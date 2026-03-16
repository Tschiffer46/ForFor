import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ShoppingCart } from 'lucide-react'

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
        <h1 className="text-2xl font-bold">Mina bestallningar</h1>
        <p className="text-gray-600 mt-1">{orders.length} totalt</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Du har inga bestallningar annu.</p>
            <p className="text-sm text-gray-400 mt-2">
              Skapa din forsta bestallning genom att klicka pa &quot;Ny Order&quot; nedan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{order.customer.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {order.customer.address.street}
                    </p>
                    {order.customer.phone && (
                      <p className="text-sm text-gray-600">{order.customer.phone}</p>
                    )}
                  </div>
                  <Badge
                    variant={order.status === 'BETALD' ? 'success' : 'warning'}
                    className="text-sm"
                  >
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Products */}
                <div className="bg-gray-50 p-3 rounded space-y-2">
                  <p className="text-sm font-medium text-gray-700">Produkter:</p>
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <span>
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                    </div>
                  ))}
                  {order.items.some((item) => item.discountApplied) && (
                    <p className="text-xs text-green-600 font-medium">
                      Prenumerationsrabatt tillampad (10%)
                    </p>
                  )}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-bold text-lg">Totalt:</span>
                  <span className="font-bold text-xl text-green-700">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>

                {/* Metadata */}
                <div className="pt-2 border-t text-xs text-gray-500 space-y-1">
                  <p>Kampanj: {order.campaign.name}</p>
                  <p>Datum: {formatDate(order.createdAt)}</p>
                </div>

                {/* Swish QR Code */}
                {order.swishQrCode && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Swish QR-kod:
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={order.swishQrCode}
                      alt="Swish QR code"
                      className="w-32 h-32 mx-auto"
                    />
                    <p className="text-xs text-center text-gray-500 mt-2">
                      Visa denna kod for kunden
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
