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
    const campaigns = await prisma.priceCampaign.findMany({
      where: { product: { id, organizationId: user.organizationId } },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Error fetching price campaigns:', error)
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
    })
    if (!product) {
      return NextResponse.json({ error: 'Produkt hittades inte' }, { status: 404 })
    }

    const body = await request.json()
    const { discountType, discountValue, startDate, endDate, description } = body

    if (!discountType || discountValue === undefined || !startDate || !endDate) {
      return NextResponse.json({ error: 'Rabattyp, värde, start- och slutdatum krävs' }, { status: 400 })
    }

    if (discountType !== 'percentage' && discountType !== 'absolute') {
      return NextResponse.json({ error: 'Rabattyp måste vara "percentage" eller "absolute"' }, { status: 400 })
    }

    const campaign = await prisma.priceCampaign.create({
      data: {
        productId: id,
        discountType,
        discountValue: parseInt(discountValue, 10),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description: description || null,
      },
    })

    revalidatePath(`/admin/produkter/${id}`)
    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error('Error creating price campaign:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
