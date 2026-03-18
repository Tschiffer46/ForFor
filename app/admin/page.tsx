import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { RevenueChart } from '@/components/admin/revenue-chart'

export default async function AdminDashboard() {
  const user = await getCurrentUser()
  if (!user) return null

  if (user.role === 'ORG_ADMIN') {
    const [totalClubs, activeClubs, totalProducts, totalOrders, totalRevenue, totalSuppliers] = await Promise.all([
      prisma.club.count({ where: { organizationId: user.organizationId! } }),
      prisma.club.count({ where: { organizationId: user.organizationId!, active: true } }),
      prisma.product.count({ where: { organizationId: user.organizationId!, archived: false } }),
      prisma.order.count({ where: { team: { lagGroup: { club: { organizationId: user.organizationId! } } } } }),
      prisma.order.aggregate({
        where: { status: 'BETALD', team: { lagGroup: { club: { organizationId: user.organizationId! } } } },
        _sum: { totalAmount: true },
      }),
      prisma.supplier.count({ where: { organizationId: user.organizationId!, active: true } }),
    ])

    // Supply status data
    const products = await prisma.product.findMany({
      where: { organizationId: user.organizationId!, active: true, archived: false },
      include: {
        orderItems: { select: { quantity: true } },
        supplierOrders: {
          where: { status: { in: ['ORDERED', 'DELIVERED'] } },
          select: { quantity: true },
        },
      },
    })

    const soldNotOrdered = products
      .map((p) => {
        const totalSold = p.orderItems.reduce((sum, item) => sum + item.quantity, 0)
        const totalOrdered = p.supplierOrders.reduce((sum, so) => sum + so.quantity, 0)
        return { name: p.name, totalSold, totalOrdered, difference: totalSold - totalOrdered }
      })
      .filter((p) => p.difference > 0)

    const pendingDeliveries = await prisma.supplierOrder.findMany({
      where: {
        supplier: { organizationId: user.organizationId! },
        status: 'ORDERED',
      },
      include: {
        supplier: { select: { name: true } },
        product: { select: { name: true } },
      },
      orderBy: { expectedDelivery: 'asc' },
      take: 10,
    })

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AZ Profil - Dashboard</h1>
          <p className="text-gray-600 mt-1">Översikt över alla klubbar</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Aktiva klubbar</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{activeClubs} / {totalClubs}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Produkter</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalProducts}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Beställningar</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalOrders}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Total intäkt</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatCurrency(totalRevenue._sum.totalAmount || 0)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Leverantörer</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalSuppliers}</div></CardContent>
          </Card>
        </div>

        {/* Revenue Chart (#4) */}
        <Card>
          <CardHeader><CardTitle>Försäljning per månad</CardTitle></CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>

        {/* Supply Status Tables (#3) */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Sålt men ej beställt från leverantör</CardTitle></CardHeader>
            <CardContent>
              {soldNotOrdered.length === 0 ? (
                <p className="text-gray-500 text-sm">Allt är beställt</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 font-medium text-gray-600">Produkt</th>
                        <th className="text-right py-2 font-medium text-gray-600">Sålt</th>
                        <th className="text-right py-2 font-medium text-gray-600">Beställt</th>
                        <th className="text-right py-2 font-medium text-gray-600">Differens</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {soldNotOrdered.map((p) => (
                        <tr key={p.name}>
                          <td className="py-2">{p.name}</td>
                          <td className="py-2 text-right">{p.totalSold}</td>
                          <td className="py-2 text-right">{p.totalOrdered}</td>
                          <td className="py-2 text-right font-bold text-orange-600">{p.difference}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Beställt men ej levererat</CardTitle></CardHeader>
            <CardContent>
              {pendingDeliveries.length === 0 ? (
                <p className="text-gray-500 text-sm">Inga väntande leveranser</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 font-medium text-gray-600">Produkt</th>
                        <th className="text-left py-2 font-medium text-gray-600">Leverantör</th>
                        <th className="text-right py-2 font-medium text-gray-600">Antal</th>
                        <th className="text-right py-2 font-medium text-gray-600">Förväntat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pendingDeliveries.map((so) => (
                        <tr key={so.id}>
                          <td className="py-2">{so.product.name}</td>
                          <td className="py-2">{so.supplier.name}</td>
                          <td className="py-2 text-right">{so.quantity}</td>
                          <td className="py-2 text-right">{so.expectedDelivery ? formatDate(so.expectedDelivery) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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
        <p className="text-gray-600 mt-1">Översikt över försäljning</p>
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Totalt beställningar</CardTitle></CardHeader>
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
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Total intäkt</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalRevenue._sum.totalAmount || 0)}</div></CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Lag & Medlemmar</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-600">Antal team:</span><span className="font-bold">{totalTeams}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Antal säljare:</span><span className="font-bold">{totalMembers}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Senaste beställningarna</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-gray-500 text-sm">Inga beställningar ännu</p>
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
