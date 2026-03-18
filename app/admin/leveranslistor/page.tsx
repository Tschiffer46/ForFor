import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { PrintButton } from '@/components/admin/print-button'
import CarLoading from '@/components/admin/car-loading'
import DeliveryTableWrapper from './delivery-table-wrapper'
import CampaignSelector from './campaign-selector'

export default async function LeveranslistorPage({
  searchParams,
}: {
  searchParams: Promise<{ kampanj?: string }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  if (!user.clubId) {
    return <p className="text-gray-500">Ingen klubb tilldelad.</p>
  }

  const { kampanj: selectedCampaignId } = await searchParams

  try {
    // Fetch all campaigns for this club
    const campaigns = await prisma.campaign.findMany({
      where: { clubId: user.clubId },
      orderBy: { salesStart: 'desc' },
      select: { id: true, name: true, status: true },
    })

    // Default to active campaign if none selected
    const activeCampaign = campaigns.find((c) => c.status === 'ACTIVE')
    const campaignId = selectedCampaignId || activeCampaign?.id || campaigns[0]?.id

    if (!campaignId) {
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Leveranslistor</h1>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Inga kampanjer hittades.</p>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Fetch all orders for the selected campaign with deliveries
    const orders = await prisma.order.findMany({
      where: {
        campaignId,
        team: {
          lagGroup: { clubId: user.clubId },
        },
      },
      include: {
        customer: {
          include: {
            address: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        deliveries: true,
        team: {
          include: {
            lagGroup: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Auto-create Delivery records for orders that have none
    const ordersWithoutDelivery = orders.filter((o) => o.deliveries.length === 0)
    if (ordersWithoutDelivery.length > 0) {
      await prisma.delivery.createMany({
        data: ordersWithoutDelivery.map((o) => ({
          orderId: o.id,
          status: 'EJ_HAMTAD' as const,
        })),
      })
      // Re-fetch deliveries for these orders
      const newDeliveries = await prisma.delivery.findMany({
        where: { orderId: { in: ordersWithoutDelivery.map((o) => o.id) } },
      })
      // Merge into orders
      for (const delivery of newDeliveries) {
        const order = orders.find((o) => o.id === delivery.orderId)
        if (order) {
          order.deliveries.push(delivery)
        }
      }
    }

    // Build car loading summary: aggregate products across all teams
    const productAggregation = new Map<
      string,
      { name: string; totalQuantity: number; weight: number }
    >()
    for (const order of orders) {
      for (const item of order.items) {
        const existing = productAggregation.get(item.productId)
        const itemWeight = (item.product.weightPerUnit ?? 0) * item.quantity
        if (existing) {
          existing.totalQuantity += item.quantity
          existing.weight += itemWeight
        } else {
          productAggregation.set(item.productId, {
            name: item.product.name,
            totalQuantity: item.quantity,
            weight: itemWeight,
          })
        }
      }
    }
    const carLoadingProducts = Array.from(productAggregation.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'sv')
    )

    // Group by team for per-team car loading
    const teamGroups = new Map<
      string,
      {
        teamName: string
        products: Map<string, { name: string; totalQuantity: number; weight: number }>
      }
    >()
    for (const order of orders) {
      let group = teamGroups.get(order.teamId)
      if (!group) {
        group = {
          teamName: order.team.name,
          products: new Map(),
        }
        teamGroups.set(order.teamId, group)
      }
      for (const item of order.items) {
        const existing = group.products.get(item.productId)
        const itemWeight = (item.product.weightPerUnit ?? 0) * item.quantity
        if (existing) {
          existing.totalQuantity += item.quantity
          existing.weight += itemWeight
        } else {
          group.products.set(item.productId, {
            name: item.product.name,
            totalQuantity: item.quantity,
            weight: itemWeight,
          })
        }
      }
    }

    // Serialize deliveries for client component
    const serializedDeliveries = orders.map((order) => {
      const delivery = order.deliveries[0]
      const productsText = order.items
        .map((item) => `${item.quantity}x ${item.product.name}`)
        .join('\n')

      return {
        id: order.id,
        deliveryId: delivery.id,
        deliveryStatus: delivery.status,
        deliveryNotes: delivery.notes,
        orderId: order.id,
        address: order.customer.address?.street ?? '-',
        city: order.customer.address?.city ?? '-',
        customerName: order.customer.name,
        customerNumber: order.customer.customerNumber,
        phone: order.customer.phone,
        products: productsText,
        totalAmount: order.totalAmount,
        orderStatus: order.status,
        teamName: order.team.name,
      }
    })

    const campaignOptions = campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      active: c.status === 'ACTIVE',
    }))

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Leveranslistor</h1>
            <p className="text-gray-600 mt-1">
              Hantera leveranser per kampanj
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <CampaignSelector
              campaigns={campaignOptions}
              selectedId={campaignId}
            />
            <PrintButton />
          </div>
        </div>

        {/* Car Loading Summary */}
        <CarLoading products={carLoadingProducts} />

        {/* Per-team breakdown (print-friendly) */}
        {teamGroups.size > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from(teamGroups.entries()).map(([teamId, group]) => {
              const teamProducts = Array.from(group.products.values()).sort((a, b) =>
                a.name.localeCompare(b.name, 'sv')
              )
              return (
                <Card key={teamId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{group.teamName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {teamProducts.map((p) => (
                        <div key={p.name} className="flex justify-between text-sm">
                          <span>{p.name}</span>
                          <span className="font-semibold">{p.totalQuantity} st</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Delivery Table */}
        {serializedDeliveries.length > 0 ? (
          <DeliveryTableWrapper deliveries={serializedDeliveries} />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Inga beställningar för denna kampanj ännu.</p>
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
            Hantera leveranser per kampanj
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-500">Ett fel uppstod vid hämtning av leveranslistor.</p>
            <p className="text-sm text-gray-400 mt-2">Försök igen senare.</p>
          </CardContent>
        </Card>
      </div>
    )
  }
}
