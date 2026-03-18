import { NextRequest, NextResponse } from 'next/server'
import { requireOrgAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function GET(request: NextRequest) {
  try {
    const user = await requireOrgAdmin()
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')

    const where: Record<string, unknown> = {
      supplier: { organizationId: user.organizationId },
    }
    if (status) where.status = status
    if (supplierId) where.supplierId = supplierId

    const orders = await prisma.supplierOrder.findMany({
      where,
      include: { supplier: true, product: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error fetching supplier orders:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireOrgAdmin()
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { supplierId, productId, quantity, orderDate, expectedDelivery, notes } = body

    if (!supplierId || !productId || !quantity) {
      return NextResponse.json({ error: 'Leverantör, produkt och antal krävs' }, { status: 400 })
    }

    // Verify supplier belongs to org
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, organizationId: user.organizationId },
    })
    if (!supplier) {
      return NextResponse.json({ error: 'Leverantör hittades inte' }, { status: 404 })
    }

    const order = await prisma.supplierOrder.create({
      data: {
        supplierId,
        productId,
        quantity: parseInt(quantity, 10),
        orderDate: orderDate ? new Date(orderDate) : null,
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
        notes: notes || null,
      },
      include: { supplier: true, product: true },
    })

    revalidatePath('/admin/leverantorer')
    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier order:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
