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
    const supplier = await prisma.supplier.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        products: { include: { product: true } },
        supplierOrders: { include: { product: true }, orderBy: { createdAt: 'desc' } },
      },
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Leverantör hittades inte' }, { status: 404 })
    }

    return NextResponse.json({ supplier })
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

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
    const existing = await prisma.supplier.findFirst({
      where: { id, organizationId: user.organizationId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Leverantör hittades inte' }, { status: 404 })
    }

    const body = await request.json()
    const { name, contactName, contactEmail, contactPhone, notes, active } = body

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(contactName !== undefined && { contactName }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(notes !== undefined && { notes }),
        ...(active !== undefined && { active }),
      },
    })

    revalidatePath('/admin/leverantorer')
    return NextResponse.json({ supplier })
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOrgAdmin()
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.supplier.findFirst({
      where: { id, organizationId: user.organizationId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Leverantör hittades inte' }, { status: 404 })
    }

    await prisma.supplier.delete({ where: { id } })

    revalidatePath('/admin/leverantorer')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
