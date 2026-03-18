import { NextRequest, NextResponse } from 'next/server'
import { requireOrgAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOrgAdmin()
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const productSuppliers = await prisma.productSupplier.findMany({
      where: { product: { id, organizationId: user.organizationId } },
      include: { supplier: true },
      orderBy: { isCurrent: 'desc' },
    })

    return NextResponse.json({ productSuppliers })
  } catch (error) {
    console.error('Error fetching product suppliers:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOrgAdmin()
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const product = await prisma.product.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { productSuppliers: true },
    })
    if (!product) {
      return NextResponse.json({ error: 'Produkt hittades inte' }, { status: 404 })
    }

    if (product.productSuppliers.length >= 3) {
      return NextResponse.json({ error: 'Max 3 leverantörer per produkt' }, { status: 400 })
    }

    const body = await request.json()
    const { supplierId, sellPrice, isCurrent } = body

    if (!supplierId || sellPrice === undefined) {
      return NextResponse.json({ error: 'Leverantör och inköpspris krävs' }, { status: 400 })
    }

    // If marking as current, unset others
    if (isCurrent) {
      await prisma.productSupplier.updateMany({
        where: { productId: id },
        data: { isCurrent: false },
      })
    }

    const productSupplier = await prisma.productSupplier.create({
      data: {
        productId: id,
        supplierId,
        sellPrice: parseInt(sellPrice, 10),
        isCurrent: isCurrent || false,
      },
      include: { supplier: true },
    })

    revalidatePath(`/admin/produkter/${id}`)
    return NextResponse.json({ productSupplier }, { status: 201 })
  } catch (error) {
    console.error('Error adding product supplier:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOrgAdmin()
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')

    if (!supplierId) {
      return NextResponse.json({ error: 'supplierId krävs' }, { status: 400 })
    }

    await prisma.productSupplier.deleteMany({
      where: {
        productId: id,
        supplierId,
        product: { organizationId: user.organizationId },
      },
    })

    revalidatePath(`/admin/produkter/${id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing product supplier:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
