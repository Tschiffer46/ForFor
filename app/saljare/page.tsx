import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatDate, formatCurrency } from '@/lib/utils'
import { DashboardTabs } from './dashboard-tabs'

export default async function SeljarHomePage() {
  const user = await getCurrentUser()
  if (!user) return null

  // Fetch all data in parallel
  const [currentCampaign, totalOrders, paidOrders, totalRevenue, districts] = await Promise.all([
    prisma.campaign.findFirst({
      where: {
        clubId: user.clubId!,
        salesStart: { lte: new Date() },
        salesEnd: { gte: new Date() },
      },
    }),
    prisma.order.count({ where: { sellerId: user.id } }),
    prisma.order.count({ where: { sellerId: user.id, status: 'BETALD' } }),
    prisma.order.aggregate({
      where: { sellerId: user.id, status: 'BETALD' },
      _sum: { totalAmount: true },
    }),
    user.teamId
      ? prisma.district.findMany({
          where: { teamId: user.teamId },
          include: {
            streets: {
              include: {
                addresses: {
                  include: {
                    visits: {
                      orderBy: { createdAt: 'desc' },
                      take: 1,
                      where: user.clubId
                        ? { campaign: { clubId: user.clubId } }
                        : undefined,
                      select: { result: true },
                    },
                  },
                },
              },
              orderBy: { name: 'asc' },
            },
          },
        })
      : [],
  ])

  // Build street progress data
  const streetProgress = districts.flatMap((d) =>
    d.streets.map((street) => {
      const total = street.addresses.length
      const visited = street.addresses.filter((a) => a.visits.length > 0).length
      const bought = street.addresses.filter(
        (a) => a.visits[0]?.result === 'KOPT'
      ).length
      return {
        id: street.id,
        name: street.name,
        total,
        visited,
        bought,
      }
    })
  )

  // Calculate campaign days remaining
  const daysRemaining = currentCampaign
    ? Math.max(
        0,
        Math.ceil(
          (currentCampaign.salesEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : null

  return (
    <DashboardTabs
      userName={user.name}
      campaign={
        currentCampaign
          ? {
              name: currentCampaign.name,
              salesEnd: formatDate(currentCampaign.salesEnd),
              deliveryStart: currentCampaign.deliveryStart
                ? formatDate(currentCampaign.deliveryStart)
                : null,
              daysRemaining: daysRemaining!,
            }
          : null
      }
      stats={{
        totalOrders,
        paidOrders,
        totalRevenue: formatCurrency(totalRevenue._sum.totalAmount || 0),
      }}
      streetProgress={streetProgress}
    />
  )
}
