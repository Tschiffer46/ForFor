import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export default async function AdminDashboard() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  // Get statistics
  const [
    totalOrders,
    unpaidOrders,
    paidOrders,
    totalRevenue,
    totalTeams,
    totalMembers,
  ] = await Promise.all([
    prisma.order.count({
      where: { saljare: { foreningId: user.foreningId } },
    }),
    prisma.order.count({
      where: {
        saljare: { foreningId: user.foreningId },
        status: 'OBETALD',
      },
    }),
    prisma.order.count({
      where: {
        saljare: { foreningId: user.foreningId },
        status: 'BETALD',
      },
    }),
    prisma.order.aggregate({
      where: {
        saljare: { foreningId: user.foreningId },
        status: 'BETALD',
      },
      _sum: {
        totalBelopp: true,
      },
    }),
    prisma.lag.count({
      where: { foreningId: user.foreningId },
    }),
    prisma.anvandare.count({
      where: {
        foreningId: user.foreningId,
        roll: 'TEAM_MEMBER',
      },
    }),
  ])

  const revenue = totalRevenue._sum.totalBelopp || 0

  // Get recent orders
  const recentOrders = await prisma.order.findMany({
    where: {
      saljare: { foreningId: user.foreningId },
    },
    include: {
      kund: true,
      saljare: true,
      saljrunda: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-1">Översikt över föreningens försäljning</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Totalt antal beställningar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Obetalda beställningar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unpaidOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Betalda beställningar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total intäkt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Additional stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lag & Medlemmar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Antal lag:</span>
              <span className="font-bold">{totalTeams}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Antal säljare:</span>
              <span className="font-bold">{totalMembers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Senaste beställningarna</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-gray-500 text-sm">Inga beställningar ännu</p>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between pb-3 border-b last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{order.kund.namn}</p>
                      <p className="text-xs text-gray-500">{order.saljare.namn}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold text-sm">{formatCurrency(order.totalBelopp)}</p>
                      <Badge variant={order.status === 'BETALD' ? 'success' : 'warning'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
