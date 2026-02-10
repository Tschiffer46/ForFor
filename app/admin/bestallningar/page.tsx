import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Prisma } from '@prisma/client'

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    kund: true
    saljare: {
      include: {
        lag: true
      }
    }
    saljrunda: true
    orderItems: {
      include: {
        produkt: true
      }
    }
  }
}>

export default async function BestallningarPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const orders: OrderWithRelations[] = await prisma.order.findMany({
    where: {
      saljare: { foreningId: user.foreningId },
    },
    include: {
      kund: true,
      saljare: {
        include: {
          lag: true,
        },
      },
      saljrunda: true,
      orderItems: {
        include: {
          produkt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Calculate stats
  let betalda = 0
  let obetalda = 0
  for (const order of orders) {
    if (order.status === 'BETALD') betalda++
    else if (order.status === 'OBETALD') obetalda++
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Beställningar</h1>
        <p className="text-gray-600 mt-1">
          Översikt över alla beställningar ({orders.length} totalt)
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Totalt beställningar</p>
              <p className="text-3xl font-bold mt-1">{orders.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Betalda</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {betalda}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Obetalda</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {obetalda}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Datum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kund
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Säljare
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Lag
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Produkter
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Belopp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{order.kund.namn}</p>
                        {order.kund.telefon && (
                          <p className="text-xs text-gray-500">{order.kund.telefon}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{order.saljare.namn}</td>
                    <td className="px-4 py-3 text-sm">
                      {order.saljare.lag?.namn || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {order.orderItems.map((item) => (
                        <div key={item.id} className="text-xs">
                          {item.antal}x {item.produkt.namn}
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3 font-bold">
                      {formatCurrency(order.totalBelopp)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={order.status === 'BETALD' ? 'success' : 'warning'}
                      >
                        {order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}

                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      Inga beställningar ännu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
