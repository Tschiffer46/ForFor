import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const product = await prisma.product.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        productSuppliers: { include: { supplier: true }, orderBy: { isCurrent: 'desc' } },
        priceCampaigns: { orderBy: { startDate: 'desc' } },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produkt hittades inte' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ORG_ADMIN' || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, price, listPrice, imageUrl, active, archived, size, weightPerUnit, sacksPerPallet, mustBuyPerPallet } = body

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Namn och pris ar obligatoriska' }, { status: 400 })
    }

    const existingProduct = await prisma.product.findFirst({
      where: { id, organizationId: user.organizationId },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produkt hittades inte' }, { status: 404 })
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price: parseInt(price, 10),
        listPrice: listPrice ? parseInt(listPrice, 10) : null,
        imageUrl: imageUrl || null,
        size: size || null,
        weightPerUnit: weightPerUnit ? parseFloat(weightPerUnit) : null,
        sacksPerPallet: sacksPerPallet ? parseInt(sacksPerPallet, 10) : null,
        mustBuyPerPallet: mustBuyPerPallet ?? false,
        ...(active !== undefined && { active }),
        ...(archived !== undefined && { archived }),
      },
    })

    revalidatePath('/admin/produkter')
    revalidatePath(`/admin/produkter/${id}`)
    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ORG_ADMIN' || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existingProduct = await prisma.product.findFirst({
      where: { id, organizationId: user.organizationId },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produkt hittades inte' }, { status: 404 })
    }

    await prisma.product.delete({
      where: { id },
    })

    revalidatePath('/admin/produkter')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
