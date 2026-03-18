import { NextResponse } from 'next/server'
import { requireOrgAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await requireOrgAdmin()
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Table 1: Products sold to customers but not yet ordered from suppliers
    const products = await prisma.product.findMany({
      where: { organizationId: user.organizationId, active: true },
      include: {
        orderItems: {
          select: { quantity: true },
        },
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
        const difference = totalSold - totalOrdered
        return {
          productId: p.id,
          productName: p.name,
          totalSold,
          totalOrdered,
          difference,
        }
      })
      .filter((p) => p.difference > 0)
      .sort((a, b) => b.difference - a.difference)

    // Table 2: Ordered from suppliers but not yet delivered
    const pendingDeliveries = await prisma.supplierOrder.findMany({
      where: {
        supplier: { organizationId: user.organizationId },
        status: 'ORDERED',
      },
      include: {
        supplier: { select: { name: true } },
        product: { select: { name: true } },
      },
      orderBy: { expectedDelivery: 'asc' },
    })

    const orderedNotDelivered = pendingDeliveries.map((so) => ({
      id: so.id,
      productName: so.product.name,
      supplierName: so.supplier.name,
      quantity: so.quantity,
      orderDate: so.orderDate,
      expectedDelivery: so.expectedDelivery,
    }))

    return NextResponse.json({ soldNotOrdered, orderedNotDelivered })
  } catch (error) {
    console.error('Error fetching supply status:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
