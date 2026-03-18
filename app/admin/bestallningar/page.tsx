import { Card, CardContent } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import OrdersTable, { type SerializedOrder } from '@/components/admin/orders-table'

export default async function BestallningarPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const isOrgAdmin = user.role === 'ORG_ADMIN'

  // ORG_ADMIN sees all orders across all clubs, CLUB_ADMIN sees own club's orders
  const whereClause = isOrgAdmin
    ? { team: { lagGroup: { club: { organizationId: user.organizationId! } } } }
    : user.clubId
      ? { team: { lagGroup: { clubId: user.clubId } } }
      : null

  if (!whereClause) {
    return <p className="text-gray-500">Ingen klubb tilldelad.</p>
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      customer: {
        include: { address: true },
      },
      seller: true,
      team: { include: { lagGroup: { include: { club: true } } } },
      campaign: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const [betaldaCount, obetaldaCount] = await Promise.all([
    prisma.order.count({ where: { ...whereClause, status: 'BETALD' } }),
    prisma.order.count({ where: { ...whereClause, status: 'OBETALD' } }),
  ])

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0)

  // Serialize Dates to ISO strings for the client component
  const serializedOrders: SerializedOrder[] = orders.map((order) => ({
    id: order.id,
    status: order.status,
    totalAmount: order.totalAmount,
    comment: order.comment,
    source: order.source,
    createdAt: order.createdAt.toISOString(),
    customer: {
      id: order.customer.id,
      customerNumber: order.customer.customerNumber,
      name: order.customer.name,
      phone: order.customer.phone,
      email: order.customer.email,
      address: {
        street: order.customer.address.street,
        city: order.customer.address.city,
      },
    },
    seller: order.seller ? { id: order.seller.id, name: order.seller.name } : null,
    team: {
      id: order.team.id,
      name: order.team.name,
      lagGroup: {
        id: order.team.lagGroup.id,
        name: order.team.lagGroup.name,
        club: {
          id: order.team.lagGroup.club.id,
          name: order.team.lagGroup.club.name,
        },
      },
    },
    campaign: {
      id: order.campaign.id,
      name: order.campaign.name,
    },
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      product: { id: item.product.id, name: item.product.name },
    })),
  }))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Beställningar</h1>
        <p className="text-gray-600 mt-1">
          {isOrgAdmin ? 'Alla beställningar från alla klubbar' : 'Översikt över alla beställningar'} ({orders.length} totalt)
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Totalt</p>
              <p className="text-3xl font-bold mt-1">{orders.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Betalda</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{betaldaCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Obetalda</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{obetaldaCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total intäkt</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <OrdersTable orders={serializedOrders} showClubColumn={isOrgAdmin} />
    </div>
  )
}
