import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function getOrderWhereClause(user: { role: string; organizationId?: string | null; clubId?: string | null }, id: string) {
  if (user.role === 'ORG_ADMIN') {
    return { id, team: { lagGroup: { club: { organizationId: user.organizationId! } } } }
  }
  if (user.clubId) {
    return { id, team: { lagGroup: { clubId: user.clubId } } }
  }
  return null
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, comment, items } = body as {
      status?: string
      comment?: string
      items?: { productId: string; quantity: number }[]
    }

    const whereClause = await getOrderWhereClause(user, id)
    if (!whereClause) {
      return NextResponse.json({ error: 'Ingen klubb tilldelad' }, { status: 403 })
    }

    const existing = await prisma.order.findFirst({
      where: whereClause,
      include: { customer: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Beställning hittades inte' }, { status: 404 })
    }

    // If items are provided, recalculate total
    if (items && items.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: items.map((i) => i.productId) } },
      })

      let totalAmount = 0
      const orderItemsData = items.map((item) => {
        const product = products.find((p) => p.id === item.productId)
        if (!product) throw new Error(`Produkt ${item.productId} hittades inte`)

        totalAmount += product.price * item.quantity
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
          discountApplied: existing.customer.subscription,
          orderId: id,
        }
      })

      if (existing.customer.subscription) {
        totalAmount = Math.round(totalAmount * 0.9)
      }

      // Delete old items and create new ones, update order
      const updateData: Record<string, unknown> = { totalAmount }
      if (status !== undefined) updateData.status = status
      if (comment !== undefined) updateData.comment = comment

      await prisma.$transaction([
        prisma.orderItem.deleteMany({ where: { orderId: id } }),
        prisma.orderItem.createMany({ data: orderItemsData }),
        prisma.order.update({
          where: { id },
          data: updateData,
        }),
      ])
    } else {
      const updateData: Record<string, unknown> = {}
      if (status !== undefined) updateData.status = status
      if (comment !== undefined) updateData.comment = comment

      await prisma.order.update({
        where: { id },
        data: updateData,
      })
    }

    revalidatePath('/admin/bestallningar')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const whereClause = await getOrderWhereClause(user, id)
    if (!whereClause) {
      return NextResponse.json({ error: 'Ingen klubb tilldelad' }, { status: 403 })
    }

    const existing = await prisma.order.findFirst({ where: whereClause })
    if (!existing) {
      return NextResponse.json({ error: 'Beställning hittades inte' }, { status: 404 })
    }

    // Delete related records first, then the order
    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { orderId: id } }),
      prisma.delivery.deleteMany({ where: { orderId: id } }),
      prisma.order.delete({ where: { id } }),
    ])

    revalidatePath('/admin/bestallningar')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
