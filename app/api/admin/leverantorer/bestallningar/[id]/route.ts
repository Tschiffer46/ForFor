import { NextRequest, NextResponse } from 'next/server'
import { requireOrgAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOrgAdmin()
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.supplierOrder.findFirst({
      where: { id, supplier: { organizationId: user.organizationId } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Beställning hittades inte' }, { status: 404 })
    }

    const body = await request.json()
    const { status, orderDate, expectedDelivery, actualDelivery, notes } = body

    const order = await prisma.supplierOrder.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(orderDate !== undefined && { orderDate: orderDate ? new Date(orderDate) : null }),
        ...(expectedDelivery !== undefined && { expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null }),
        ...(actualDelivery !== undefined && { actualDelivery: actualDelivery ? new Date(actualDelivery) : null }),
        ...(notes !== undefined && { notes }),
      },
      include: { supplier: true, product: true },
    })

    revalidatePath('/admin/leverantorer')
    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error updating supplier order:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
