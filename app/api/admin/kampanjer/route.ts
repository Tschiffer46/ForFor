import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.clubId) {
      return NextResponse.json({ error: 'No club assigned' }, { status: 400 })
    }

    const campaigns = await prisma.campaign.findMany({
      where: {
        clubId: user.clubId,
      },
      include: {
        products: {
          include: { product: true },
        },
        campaignTeams: {
          include: {
            team: {
              include: { lagGroup: true },
            },
          },
        },
        _count: {
          select: { orders: true },
        },
        orders: {
          select: { totalAmount: true },
        },
      },
      orderBy: {
        salesStart: 'desc',
      },
    })

    // Aggregate total revenue per campaign
    const campaignsWithRevenue = campaigns.map((campaign) => {
      const totalRevenue = campaign.orders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      )
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { orders, ...rest } = campaign
      return { ...rest, totalRevenue }
    })

    return NextResponse.json({ campaigns: campaignsWithRevenue })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.clubId) {
      return NextResponse.json({ error: 'No club assigned' }, { status: 400 })
    }

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

    if (!name || !salesStart || !salesEnd) {
      return NextResponse.json(
        { error: 'Namn, försäljningsstart och försäljningsslut är obligatoriska' },
        { status: 400 }
      )
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        status: status || 'DRAFT',
        salesStart: new Date(salesStart),
        salesEnd: new Date(salesEnd),
        deliveryStart: deliveryStart ? new Date(deliveryStart) : null,
        deliveryEnd: deliveryEnd ? new Date(deliveryEnd) : null,
        preparationStart: preparationStart ? new Date(preparationStart) : null,
        preparationEnd: preparationEnd ? new Date(preparationEnd) : null,
        transportStart: transportStart ? new Date(transportStart) : null,
        transportEnd: transportEnd ? new Date(transportEnd) : null,
        recurring: recurring ?? true,
        clubId: user.clubId,
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

    revalidatePath('/admin/kampanjer')
    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
