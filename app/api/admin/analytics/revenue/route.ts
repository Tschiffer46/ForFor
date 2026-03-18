import { NextRequest, NextResponse } from 'next/server'
import { requireOrgAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await requireOrgAdmin()
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString(), 10)

    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year + 1, 0, 1)

    // Get all orders for the year
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lt: endDate },
        team: { lagGroup: { club: { organizationId: user.organizationId } } },
      },
      select: {
        totalAmount: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            productId: true,
          },
        },
      },
    })

    // Get supplier orders for the year to determine what's been ordered
    const supplierOrders = await prisma.supplierOrder.findMany({
      where: {
        supplier: { organizationId: user.organizationId },
        createdAt: { gte: startDate, lt: endDate },
        status: { in: ['ORDERED', 'DELIVERED'] },
      },
      select: {
        productId: true,
        quantity: true,
        createdAt: true,
      },
    })

    // Build supplier order quantities by product
    const supplierOrderedByProduct = new Map<string, number>()
    for (const so of supplierOrders) {
      supplierOrderedByProduct.set(
        so.productId,
        (supplierOrderedByProduct.get(so.productId) || 0) + so.quantity
      )
    }

    // Aggregate by month
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      soldNotOrdered: 0,
      other: 0,
    }))

    for (const order of orders) {
      const monthIndex = order.createdAt.getMonth()
      // Check if any items in this order have products not yet ordered from supplier
      const hasUnorderedProducts = order.items.some((item) => {
        const ordered = supplierOrderedByProduct.get(item.productId) || 0
        return ordered < item.quantity
      })

      if (hasUnorderedProducts) {
        months[monthIndex].soldNotOrdered += order.totalAmount
      } else {
        months[monthIndex].other += order.totalAmount
      }
    }

    return NextResponse.json({ months, year })
  } catch (error) {
    console.error('Error fetching revenue data:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
