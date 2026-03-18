import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { Upload } from 'lucide-react'
import { KundImport } from '@/components/admin/kund-import'
import CustomersTable, {
  type SerializedCustomer,
} from '@/components/admin/customers-table'

function computeSaleType(orders: { source: string }[]): string {
  if (orders.length === 0) return 'Ingen försäljning ännu'
  if (orders.some((o) => o.source === 'SALES_REP')) return 'Säljare'
  if (orders.some((o) => o.source === 'WEB')) return 'Webbsida'
  return 'Ingen försäljning ännu'
}

function computeVisitStatus(
  visits: { result: string; createdAt: Date }[],
  hasOrders: boolean
): string {
  if (visits.length === 0) {
    return hasOrders ? 'Beställde via webb' : 'Ej besökt'
  }

  // Sort by date descending, check the latest visit
  const sorted = [...visits].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )
  const latest = sorted[0].result

  switch (latest) {
    case 'KOPT':
      return 'Besökt och köpte'
    case 'NEJ_TACK':
    case 'NEJ_TACK_FRAMTIDEN':
      return 'Besökt, köpte inte'
    case 'INGEN_HEMMA':
      return 'Besökt, ingen hemma'
    case 'EJ_BESIKT':
      return 'Ej besökt'
    default:
      return 'Ej besökt'
  }
}

export default async function KunderPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  if (!user.clubId) {
    return <p className="text-gray-500">Ingen klubb tilldelad.</p>
  }

  const customers = await prisma.customer.findMany({
    where: {
      address: {
        streetRef: {
          district: {
            team: {
              lagGroup: {
                clubId: user.clubId,
              },
            },
          },
        },
      },
    },
    include: {
      address: {
        include: {
          streetRef: {
            include: {
              district: {
                include: {
                  team: true,
                },
              },
            },
          },
          visits: {
            orderBy: { createdAt: 'desc' },
          },
        },
      },
      orders: {
        include: {
          campaign: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Serialize to plain objects — no Date fields or Prisma objects reach the client
  const serialized: SerializedCustomer[] = customers.map((c) => {
    const latestOrder = c.orders[0] ?? null

    return {
      id: c.id,
      customerNumber: c.customerNumber,
      name: c.name,
      phone: c.phone,
      email: c.email,
      subscription: c.subscription,
      address: {
        street: c.address.street,
        postalCode: c.address.postalCode,
        city: c.address.city,
      },
      teamName: c.address.streetRef.district.team.name,
      orderCount: c.orders.length,
      lastCampaignName: latestOrder?.campaign.name ?? null,
      saleType: computeSaleType(c.orders),
      visitStatus: computeVisitStatus(c.address.visits, c.orders.length > 0),
    }
  })

  const totalCustomers = serialized.length
  const withSubscription = serialized.filter((c) => c.subscription).length
  const withOrders = serialized.filter((c) => c.orderCount > 0).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kunder</h1>
          <p className="text-gray-600 mt-1">
            Hantera kunder och importera från Excel
          </p>
        </div>
        <KundImport
          trigger={
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Importera kunder
            </Button>
          }
        />
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Totalt kunder</p>
              <p className="text-3xl font-bold mt-1">{totalCustomers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Med prenumeration</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {withSubscription}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Gjort beställningar</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {withOrders}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers table with filters */}
      <CustomersTable customers={serialized} />
    </div>
  )
}
