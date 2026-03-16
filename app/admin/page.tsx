import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export default async function AdminDashboard() {
  const user = await getCurrentUser()
  if (!user) return null

  if (user.role === 'ORG_ADMIN') {
    const [totalClubs, activeClubs, totalProducts, totalOrders, totalRevenue] = await Promise.all([
      prisma.club.count({ where: { organizationId: user.organizationId! } }),
      prisma.club.count({ where: { organizationId: user.organizationId!, active: true } }),
      prisma.product.count({ where: { organizationId: user.organizationId! } }),
      prisma.order.count(),
      prisma.order.aggregate({ where: { status: 'BETALD' }, _sum: { totalAmount: true } }),
    ])

    const recentOrders = await prisma.order.findMany({
      include: { customer: true, team: { include: { lagGroup: { include: { club: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AZ Profil - Dashboard</h1>
          <p className="text-gray-600 mt-1">Oversikt over alla klubbar</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Aktiva klubbar</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{activeClubs} / {totalClubs}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Produkter</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalProducts}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Totalt bestallningar</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalOrders}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Total intakt</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatCurrency(totalRevenue._sum.totalAmount || 0)}</div></CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Senaste bestallningarna</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-gray-500 text-sm">Inga bestallningar annu</p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between pb-3 border-b last:border-0">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{order.customer.name}</p>
                      <p className="text-xs text-gray-500">{order.team.lagGroup.club.name} - {order.team.name}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold text-sm">{formatCurrency(order.totalAmount)}</p>
                      <Badge variant={order.status === 'BETALD' ? 'success' : 'warning'}>{order.status}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // CLUB_ADMIN view
  if (!user.clubId) return null

  const [totalOrders, unpaidOrders, paidOrders, totalRevenue, totalTeams, totalMembers] = await Promise.all([
    prisma.order.count({ where: { team: { lagGroup: { clubId: user.clubId } } } }),
    prisma.order.count({ where: { team: { lagGroup: { clubId: user.clubId } }, status: 'OBETALD' } }),
    prisma.order.count({ where: { team: { lagGroup: { clubId: user.clubId } }, status: 'BETALD' } }),
    prisma.order.aggregate({ where: { team: { lagGroup: { clubId: user.clubId } }, status: 'BETALD' }, _sum: { totalAmount: true } }),
    prisma.team.count({ where: { lagGroup: { clubId: user.clubId } } }),
    prisma.user.count({ where: { clubId: user.clubId, role: 'TEAM_MEMBER' } }),
  ])

  const recentOrders = await prisma.order.findMany({
    where: { team: { lagGroup: { clubId: user.clubId } } },
    include: { customer: true, seller: true, campaign: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-1">Oversikt over forsaljning</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Totalt bestallningar</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalOrders}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Obetalda</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-orange-600">{unpaidOrders}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Betalda</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{paidOrders}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Total intakt</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalRevenue._sum.totalAmount || 0)}</div></CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Lag & Medlemmar</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-600">Antal team:</span><span className="font-bold">{totalTeams}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Antal saljare:</span><span className="font-bold">{totalMembers}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Senaste bestallningarna</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-gray-500 text-sm">Inga bestallningar annu</p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between pb-3 border-b last:border-0">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{order.customer.name}</p>
                      <p className="text-xs text-gray-500">{order.seller?.name}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold text-sm">{formatCurrency(order.totalAmount)}</p>
                      <Badge variant={order.status === 'BETALD' ? 'success' : 'warning'}>{order.status}</Badge>
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
