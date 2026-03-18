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

  const yearStart = new Date(new Date().getFullYear(), 0, 1)

  // KPI queries
  const [totalOrders, unpaidOrders, paidOrders, totalRevenue] = await Promise.all([
    prisma.order.count({ where: { team: { lagGroup: { clubId: user.clubId } } } }),
    prisma.order.count({ where: { team: { lagGroup: { clubId: user.clubId } }, status: 'OBETALD' } }),
    prisma.order.count({ where: { team: { lagGroup: { clubId: user.clubId } }, status: 'BETALD' } }),
    prisma.order.aggregate({ where: { team: { lagGroup: { clubId: user.clubId } }, status: 'BETALD' }, _sum: { totalAmount: true } }),
  ])

  // Lag/Team Sales Matrix: lagGroups with nested teams and order aggregation
  const lagGroups = await prisma.lagGroup.findMany({
    where: { clubId: user.clubId },
    include: {
      teams: {
        include: {
          orders: {
            select: { totalAmount: true, createdAt: true, campaignId: true, campaign: { select: { status: true } } },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  const activeCampaigns = await prisma.campaign.findMany({
    where: { clubId: user.clubId, status: 'ACTIVE' },
    select: { id: true },
  })
  const activeCampaignIds = new Set(activeCampaigns.map((c) => c.id))

  const teamSalesData = lagGroups.map((lg) => ({
    lagGroup: lg.name,
    teams: lg.teams.map((t) => {
      const allTimeTotal = t.orders.reduce((sum, o) => sum + o.totalAmount, 0)
      const ytdTotal = t.orders.filter((o) => o.createdAt >= yearStart).reduce((sum, o) => sum + o.totalAmount, 0)
      const activeCampaignTotal = t.orders.filter((o) => activeCampaignIds.has(o.campaignId)).reduce((sum, o) => sum + o.totalAmount, 0)
      return { name: t.name, allTimeTotal, ytdTotal, activeCampaignTotal }
    }),
  }))

  // Campaign Matrix: DRAFT + ACTIVE campaigns with order aggregation
  const campaigns = await prisma.campaign.findMany({
    where: { clubId: user.clubId, status: { in: ['DRAFT', 'ACTIVE'] } },
    include: {
      products: { include: { product: { select: { name: true } } } },
      orders: { select: { totalAmount: true, items: { select: { quantity: true } } } },
    },
    orderBy: { salesStart: 'asc' },
  })

  const campaignData = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    salesStart: c.salesStart,
    salesEnd: c.salesEnd,
    products: c.products.map((cp) => cp.product.name),
    totalSold: c.orders.reduce((sum, o) => o.items.reduce((s, i) => s + i.quantity, sum), 0),
    totalRevenue: c.orders.reduce((sum, o) => sum + o.totalAmount, 0),
  }))

  // Address Visit Matrix: per team
  const addressVisits = await prisma.addressVisit.findMany({
    where: { campaign: { clubId: user.clubId } },
    select: {
      result: true,
      address: {
        select: {
          streetRef: {
            select: {
              district: {
                select: { teamId: true, team: { select: { name: true, lagGroup: { select: { name: true } } } } },
              },
            },
          },
        },
      },
    },
  })

  // Total addresses per team
  const teamsWithAddresses = await prisma.team.findMany({
    where: { lagGroup: { clubId: user.clubId } },
    include: {
      lagGroup: { select: { name: true } },
      districts: {
        include: {
          streets: {
            include: { _count: { select: { addresses: true } } },
          },
        },
      },
    },
  })

  const addressVisitMap: Record<string, { teamName: string; lagGroupName: string; bought: number; noBuy: number; notVisited: number; totalAddresses: number }> = {}

  for (const team of teamsWithAddresses) {
    const totalAddresses = team.districts.reduce((sum, d) => d.streets.reduce((s, st) => s + st._count.addresses, sum), 0)
    addressVisitMap[team.id] = {
      teamName: team.name,
      lagGroupName: team.lagGroup.name,
      bought: 0,
      noBuy: 0,
      notVisited: totalAddresses,
      totalAddresses,
    }
  }

  for (const visit of addressVisits) {
    const teamId = visit.address.streetRef.district.teamId
    if (!addressVisitMap[teamId]) continue
    if (visit.result === 'KOPT') {
      addressVisitMap[teamId].bought++
      addressVisitMap[teamId].notVisited--
    } else if (visit.result !== 'EJ_BESIKT') {
      addressVisitMap[teamId].noBuy++
      addressVisitMap[teamId].notVisited--
    }
  }

  const addressVisitData = Object.values(addressVisitMap).sort((a, b) => a.lagGroupName.localeCompare(b.lagGroupName) || a.teamName.localeCompare(b.teamName))

  // Payment Matrix: per campaign
  const paymentCampaigns = await prisma.campaign.findMany({
    where: { clubId: user.clubId, status: { in: ['ACTIVE', 'DRAFT'] } },
    include: {
      orders: { select: { totalAmount: true, status: true } },
    },
    orderBy: { salesStart: 'asc' },
  })

  const paymentData = paymentCampaigns.map((c) => ({
    name: c.name,
    totalSold: c.orders.reduce((sum, o) => sum + o.totalAmount, 0),
    paid: c.orders.filter((o) => o.status === 'BETALD').reduce((sum, o) => sum + o.totalAmount, 0),
    unpaid: c.orders.filter((o) => o.status === 'OBETALD').reduce((sum, o) => sum + o.totalAmount, 0),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-1">Översikt över försäljning</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Beställningar</CardTitle></CardHeader>
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

      {/* Lag/Team Sales Matrix */}
      <Card>
        <CardHeader><CardTitle>Försäljning per lag</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 font-medium text-gray-600">Lag</th>
                  <th className="text-right py-2 font-medium text-gray-600">Totalt</th>
                  <th className="text-right py-2 font-medium text-gray-600">I år</th>
                  <th className="text-right py-2 font-medium text-gray-600">Aktiv kampanj</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {teamSalesData.map((lg) => (
                  <>
                    <tr key={lg.lagGroup} className="bg-gray-50">
                      <td className="py-2 font-semibold" colSpan={4}>{lg.lagGroup}</td>
                    </tr>
                    {lg.teams.map((t) => (
                      <tr key={`${lg.lagGroup}-${t.name}`}>
                        <td className="py-2 pl-4">{t.name}</td>
                        <td className="py-2 text-right">{formatCurrency(t.allTimeTotal)}</td>
                        <td className="py-2 text-right">{formatCurrency(t.ytdTotal)}</td>
                        <td className="py-2 text-right">{formatCurrency(t.activeCampaignTotal)}</td>
                      </tr>
                    ))}
                  </>
                ))}
                {teamSalesData.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-gray-500">Inga lag ännu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Matrix */}
      <Card>
        <CardHeader><CardTitle>Kampanjer</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 font-medium text-gray-600">Kampanj</th>
                  <th className="text-left py-2 font-medium text-gray-600">Status</th>
                  <th className="text-left py-2 font-medium text-gray-600">Period</th>
                  <th className="text-left py-2 font-medium text-gray-600">Produkter</th>
                  <th className="text-right py-2 font-medium text-gray-600">Antal sålda</th>
                  <th className="text-right py-2 font-medium text-gray-600">Intäkt</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {campaignData.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 font-medium">{c.name}</td>
                    <td className="py-2">
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : 'secondary'}>
                        {c.status === 'ACTIVE' ? 'Aktiv' : 'Utkast'}
                      </Badge>
                    </td>
                    <td className="py-2 text-gray-600">{formatDate(c.salesStart)} – {formatDate(c.salesEnd)}</td>
                    <td className="py-2 text-gray-600">{c.products.join(', ') || '–'}</td>
                    <td className="py-2 text-right">{c.totalSold}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(c.totalRevenue)}</td>
                  </tr>
                ))}
                {campaignData.length === 0 && (
                  <tr><td colSpan={6} className="py-4 text-center text-gray-500">Inga aktiva eller planerade kampanjer</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Address Visit Matrix */}
      <Card>
        <CardHeader><CardTitle>Adressbesök per lag</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 font-medium text-gray-600">Lag</th>
                  <th className="text-right py-2 font-medium text-gray-600">Besökt (köpte)</th>
                  <th className="text-right py-2 font-medium text-gray-600">Besökt (köpte inte)</th>
                  <th className="text-right py-2 font-medium text-gray-600">Ej besökt</th>
                  <th className="text-right py-2 font-medium text-gray-600">Totalt adresser</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {addressVisitData.map((row) => (
                  <tr key={`${row.lagGroupName}-${row.teamName}`}>
                    <td className="py-2">
                      <span className="text-gray-500 text-xs">{row.lagGroupName}</span>
                      <span className="mx-1 text-gray-300">/</span>
                      {row.teamName}
                    </td>
                    <td className="py-2 text-right text-green-600 font-medium">{row.bought}</td>
                    <td className="py-2 text-right text-orange-600">{row.noBuy}</td>
                    <td className="py-2 text-right text-gray-500">{row.notVisited}</td>
                    <td className="py-2 text-right font-medium">{row.totalAddresses}</td>
                  </tr>
                ))}
                {addressVisitData.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-center text-gray-500">Inga lag med adresser ännu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Matrix */}
      <Card>
        <CardHeader><CardTitle>Betalningsstatus per kampanj</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 font-medium text-gray-600">Kampanj</th>
                  <th className="text-right py-2 font-medium text-gray-600">Totalt sålt</th>
                  <th className="text-right py-2 font-medium text-gray-600">Betalt</th>
                  <th className="text-right py-2 font-medium text-gray-600">Obetalt</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paymentData.map((row) => (
                  <tr key={row.name}>
                    <td className="py-2 font-medium">{row.name}</td>
                    <td className="py-2 text-right">{formatCurrency(row.totalSold)}</td>
                    <td className="py-2 text-right text-green-600 font-medium">{formatCurrency(row.paid)}</td>
                    <td className="py-2 text-right text-orange-600 font-medium">{formatCurrency(row.unpaid)}</td>
                  </tr>
                ))}
                {paymentData.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-gray-500">Inga kampanjer</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
