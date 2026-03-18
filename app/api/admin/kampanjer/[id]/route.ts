import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        ...(user.clubId ? { clubId: user.clubId } : {}),
      },
      include: {
        products: { include: { product: true } },
        campaignTeams: {
          include: {
            team: {
              include: { lagGroup: true },
            },
          },
        },
        _count: { select: { orders: true } },
        orders: { select: { totalAmount: true } },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Kampanj hittades inte' }, { status: 404 })
    }

    const totalRevenue = campaign.orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    )
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { orders, ...rest } = campaign

    return NextResponse.json({ campaign: { ...rest, totalRevenue } })
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
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
    const {
      name,
      status,
      salesStart,
      salesEnd,
      deliveryStart,
      deliveryEnd,
      preparationStart,
      preparationEnd,
      transportStart,
      transportEnd,
      recurring,
      productIds,
      teamIds,
    } = body

    // Verify campaign belongs to user's club
    const existing = await prisma.campaign.findFirst({
      where: {
        id,
        ...(user.clubId ? { clubId: user.clubId } : {}),
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Kampanj hittades inte' }, { status: 404 })
    }

    if (!name || !salesStart || !salesEnd) {
      return NextResponse.json(
        { error: 'Namn, försäljningsstart och försäljningsslut är obligatoriska' },
        { status: 400 }
      )
    }

    // Update campaign and replace products/teams in a transaction
    const campaign = await prisma.$transaction(async (tx) => {
      // Delete old product and team links
      await tx.campaignProduct.deleteMany({ where: { campaignId: id } })
      await tx.campaignTeam.deleteMany({ where: { campaignId: id } })

      // Update campaign with new data
      return tx.campaign.update({
        where: { id },
        data: {
          name,
          status: status || existing.status,
          salesStart: new Date(salesStart),
          salesEnd: new Date(salesEnd),
          deliveryStart: deliveryStart ? new Date(deliveryStart) : null,
          deliveryEnd: deliveryEnd ? new Date(deliveryEnd) : null,
          preparationStart: preparationStart ? new Date(preparationStart) : null,
          preparationEnd: preparationEnd ? new Date(preparationEnd) : null,
          transportStart: transportStart ? new Date(transportStart) : null,
          transportEnd: transportEnd ? new Date(transportEnd) : null,
          recurring: recurring ?? existing.recurring,
          products: productIds?.length
            ? {
                create: productIds.map((productId: string) => ({
                  productId,
                })),
              }
            : undefined,
          campaignTeams: teamIds?.length
            ? {
                create: teamIds.map((teamId: string) => ({
                  teamId,
                })),
              }
            : undefined,
        },
        include: {
          products: { include: { product: true } },
          campaignTeams: { include: { team: true } },
        },
      })
    })

    revalidatePath('/admin/kampanjer')
    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify campaign belongs to user's club
    const existing = await prisma.campaign.findFirst({
      where: {
        id,
        ...(user.clubId ? { clubId: user.clubId } : {}),
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Kampanj hittades inte' }, { status: 404 })
    }

    await prisma.campaign.delete({
      where: { id },
    })

    revalidatePath('/admin/kampanjer')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
