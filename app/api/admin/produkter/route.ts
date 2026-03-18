import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const products = await prisma.product.findMany({
      where: { organizationId: user.organizationId },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        productSuppliers: { include: { supplier: true } },
        _count: { select: { priceCampaigns: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ORG_ADMIN' || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, price, listPrice, imageUrl, size, weightPerUnit, sacksPerPallet, mustBuyPerPallet } = body

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Namn och pris kravs' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price: parseInt(price, 10),
        listPrice: listPrice ? parseInt(listPrice, 10) : null,
        imageUrl: imageUrl || null,
        size: size || null,
        weightPerUnit: weightPerUnit ? parseFloat(weightPerUnit) : null,
        sacksPerPallet: sacksPerPallet ? parseInt(sacksPerPallet, 10) : null,
        mustBuyPerPallet: mustBuyPerPallet || false,
        organizationId: user.organizationId,
      },
    })

    revalidatePath('/admin/produkter')
    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
