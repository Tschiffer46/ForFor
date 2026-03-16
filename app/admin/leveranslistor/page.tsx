import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { PrintButton } from '@/components/admin/print-button'
import type { Prisma } from '@prisma/client'

type TeamWithDeliveryData = Prisma.TeamGetPayload<{
  include: {
    districts: {
      include: {
        streets: {
          include: {
            addresses: {
              include: {
                customers: {
                  include: {
                    orders: {
                      include: {
                        items: {
                          include: {
                            product: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}>

type DeliveryStreet = TeamWithDeliveryData['districts'][number]['streets'][number]
type DeliveryAddress = DeliveryStreet['addresses'][number]
type DeliveryCustomer = DeliveryAddress['customers'][number]
type DeliveryOrder = DeliveryCustomer['orders'][number]
type DeliveryOrderItem = DeliveryOrder['items'][number]

export default async function LeveranslistorPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  if (!user.clubId) {
    return <p className="text-gray-500">Ingen klubb tilldelad.</p>
  }

  try {
    // Get all teams with their districts, streets, and orders
    const teams = await prisma.team.findMany({
      where: { lagGroup: { clubId: user.clubId } },
      include: {
        districts: {
          include: {
            streets: {
              include: {
                addresses: {
                  include: {
                    customers: {
                      include: {
                        orders: {
                          include: {
                            items: {
                              include: {
                                product: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              orderBy: {
                name: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Leveranslistor</h1>
          <p className="text-gray-600 mt-1">
            Utskrivbara leveranslistor organiserade per team och gata
          </p>
        </div>

        {teams.map((team) => {
          const allStreets: DeliveryStreet[] = team.districts.flatMap((d) => d.streets)
          const streetsWithOrders = allStreets.filter((street: DeliveryStreet) =>
            street.addresses.some((addr: DeliveryAddress) =>
              addr.customers.some((cust: DeliveryCustomer) => cust.orders.length > 0)
            )
          )

          if (streetsWithOrders.length === 0) {
            return null
          }

          return (
            <Card key={team.id} className="print:shadow-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{team.name} - Leveranslista</CardTitle>
                <PrintButton />
              </CardHeader>
              <CardContent className="space-y-6">
                {streetsWithOrders.map((street: DeliveryStreet) => (
                  <div key={street.id} className="space-y-3">
                    <h3 className="font-bold text-lg border-b pb-2">
                      {street.name}, {street.city}
                    </h3>

                    {street.addresses.map((address: DeliveryAddress) => {
                      const customersWithOrders = address.customers.filter(
                        (cust: DeliveryCustomer) => cust.orders.length > 0
                      )

                      if (customersWithOrders.length === 0) {
                        return null
                      }

                      return customersWithOrders.map((customer: DeliveryCustomer) => (
                        <div
                          key={customer.id}
                          className="pl-4 py-3 border-l-2 border-gray-300 space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-bold">{customer.name}</p>
                              <p className="text-sm text-gray-600">
                                {address.street}
                              </p>
                              {customer.phone && (
                                <p className="text-sm text-gray-600">
                                  {customer.phone}
                                </p>
                              )}
                            </div>
                            {customer.subscription && (
                              <Badge variant="success" className="text-xs">
                                Prenumeration
                              </Badge>
                            )}
                          </div>

                          {customer.orders.map((order: DeliveryOrder) => (
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
                              {order.items.map((item: DeliveryOrderItem) => (
                                <p key={item.id} className="text-sm text-gray-700">
                                  - {item.quantity}x {item.product.name}
                                </p>
                              ))}
                              <p className="text-sm font-bold pt-1 border-t">
                                Totalt: {formatCurrency(order.totalAmount)}
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
          (team: TeamWithDeliveryData) =>
            !team.districts.some((d) =>
              d.streets.some((street: DeliveryStreet) =>
                street.addresses.some((addr: DeliveryAddress) =>
                  addr.customers.some((cust: DeliveryCustomer) => cust.orders.length > 0)
                )
              )
            )
        ) && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Inga bestallningar att visa annu</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  } catch (error) {
    console.error('Error loading leveranslistor:', error)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Leveranslistor</h1>
          <p className="text-gray-600 mt-1">
            Utskrivbara leveranslistor organiserade per team och gata
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-500">Ett fel uppstod vid hamtning av leveranslistor.</p>
            <p className="text-sm text-gray-400 mt-2">Forsok igen senare.</p>
          </CardContent>
        </Card>
      </div>
    )
  }
}
