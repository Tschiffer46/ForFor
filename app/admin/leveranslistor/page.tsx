import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { PrintButton } from '@/components/admin/print-button'

export default async function LeveranslistorPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  // Get all teams with their streets and orders
  const teams = await prisma.lag.findMany({
    where: { foreningId: user.foreningId },
    include: {
      streets: {
        include: {
          addresses: {
            include: {
              customers: {
                include: {
                  orders: {
                    include: {
                      orderItems: {
                        include: {
                          produkt: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        orderBy: {
          namn: 'asc',
        },
      },
    },
    orderBy: {
      namn: 'asc',
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leveranslistor</h1>
        <p className="text-gray-600 mt-1">
          Utskrivbara leveranslistor organiserade per lag och gata
        </p>
      </div>

      {teams.map((team) => {
        // Filter streets that have customers with orders
        const streetsWithOrders = team.streets.filter((street) =>
          street.addresses.some((addr) =>
            addr.customers.some((kund) => kund.orders.length > 0)
          )
        )

        if (streetsWithOrders.length === 0) {
          return null
        }

        return (
          <Card key={team.id} className="print:shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{team.namn} - Leveranslista</CardTitle>
              <PrintButton />
            </CardHeader>
            <CardContent className="space-y-6">
              {streetsWithOrders.map((street) => (
                <div key={street.id} className="space-y-3">
                  <h3 className="font-bold text-lg border-b pb-2">
                    {street.namn}, {street.stad}
                  </h3>

                  {street.addresses.map((address) => {
                    const customersWithOrders = address.customers.filter(
                      (kund) => kund.orders.length > 0
                    )

                    if (customersWithOrders.length === 0) {
                      return null
                    }

                    return customersWithOrders.map((customer) => (
                      <div
                        key={customer.id}
                        className="pl-4 py-3 border-l-2 border-gray-300 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold">{customer.namn}</p>
                            <p className="text-sm text-gray-600">
                              {address.gatuadress}
                            </p>
                            {customer.telefon && (
                              <p className="text-sm text-gray-600">
                                {customer.telefon}
                              </p>
                            )}
                          </div>
                          {customer.prenumeration && (
                            <Badge variant="success" className="text-xs">
                              Prenumeration
                            </Badge>
                          )}
                        </div>

                        {customer.orders.map((order) => (
                          <div
                            key={order.id}
                            className="bg-gray-50 p-3 rounded space-y-1"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">
                                Produkter:
                              </span>
                              <Badge
                                variant={
                                  order.status === 'BETALD' ? 'success' : 'warning'
                                }
                              >
                                {order.status}
                              </Badge>
                            </div>
                            {order.orderItems.map((item) => (
                              <p key={item.id} className="text-sm text-gray-700">
                                • {item.antal}x {item.produkt.namn}
                              </p>
                            ))}
                            <p className="text-sm font-bold pt-1 border-t">
                              Totalt: {formatCurrency(order.totalBelopp)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ))
                  })}
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}

      {teams.every(
        (team) =>
          !team.streets.some((street) =>
            street.addresses.some((addr) =>
              addr.customers.some((kund) => kund.orders.length > 0)
            )
          )
      ) && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Inga beställningar att visa ännu</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}