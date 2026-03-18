import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'

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
      customer: true,
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

  return (
    <div className="space-y-6">
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

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kund</th>
                  {isOrgAdmin && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Klubb</th>}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Säljare</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produkter</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Belopp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{order.customer.name}</p>
                        {order.customer.phone && <p className="text-xs text-gray-500">{order.customer.phone}</p>}
                      </div>
                    </td>
                    {isOrgAdmin && <td className="px-4 py-3 text-sm">{order.team.lagGroup.club.name}</td>}
                    <td className="px-4 py-3 text-sm">{order.seller?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm">{order.team?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {order.items.map((item) => (
                        <div key={item.id} className="text-xs">{item.quantity}x {item.product.name}</div>
                      ))}
                    </td>
                    <td className="px-4 py-3 font-bold">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={order.status === 'BETALD' ? 'success' : 'warning'}>{order.status}</Badge>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={isOrgAdmin ? 8 : 7} className="px-4 py-12 text-center text-gray-500">
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
