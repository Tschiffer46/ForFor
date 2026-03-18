import { NextRequest, NextResponse } from 'next/server'
import { requireOrgAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; campaignId: string }> }
) {
  try {
    const user = await requireOrgAdmin()
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, campaignId } = await params
    const existing = await prisma.priceCampaign.findFirst({
      where: { id: campaignId, product: { id, organizationId: user.organizationId } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Kampanj hittades inte' }, { status: 404 })
    }

    const body = await request.json()
    const { discountType, discountValue, startDate, endDate, description, active } = body

    const campaign = await prisma.priceCampaign.update({
      where: { id: campaignId },
      data: {
        ...(discountType !== undefined && { discountType }),
        ...(discountValue !== undefined && { discountValue: parseInt(discountValue, 10) }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(description !== undefined && { description }),
        ...(active !== undefined && { active }),
      },
    })

    revalidatePath(`/admin/produkter/${id}`)
    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Error updating price campaign:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; campaignId: string }> }
) {
  try {
    const user = await requireOrgAdmin()
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, campaignId } = await params
    const existing = await prisma.priceCampaign.findFirst({
      where: { id: campaignId, product: { id, organizationId: user.organizationId } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Kampanj hittades inte' }, { status: 404 })
    }

    await prisma.priceCampaign.delete({ where: { id: campaignId } })

    revalidatePath(`/admin/produkter/${id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting price campaign:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
