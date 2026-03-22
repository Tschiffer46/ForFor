import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSwishQRCode, formatSwishMessage } from '@/lib/swish'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.clubId) {
      return NextResponse.json({ error: 'Ingen klubb tilldelad' }, { status: 400 })
    }

    const body = await request.json()
    const { customerId, campaignId, teamId, items, status, comment } = body as {
      customerId: string
      campaignId: string
      teamId: string
      items: { productId: string; quantity: number }[]
      status?: 'OBETALD' | 'BETALD'
      comment?: string
    }

    if (!customerId || !campaignId || !teamId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Saknar obligatoriska fält' }, { status: 400 })
    }

    // Verify entities belong to the club
    const [customer, campaign, team] = await Promise.all([
      prisma.customer.findUnique({ where: { id: customerId } }),
      prisma.campaign.findFirst({ where: { id: campaignId, clubId: user.clubId } }),
      prisma.team.findFirst({ where: { id: teamId, lagGroup: { clubId: user.clubId } } }),
    ])

    if (!customer) return NextResponse.json({ error: 'Kund hittades inte' }, { status: 404 })
    if (!campaign) return NextResponse.json({ error: 'Kampanj hittades inte' }, { status: 404 })
    if (!team) return NextResponse.json({ error: 'Team hittades inte' }, { status: 404 })

    // Get products and calculate total
    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
    })

    let totalAmount = 0
    const orderItemsData = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)
      if (!product) throw new Error(`Produkt ${item.productId} hittades inte`)

      totalAmount += product.price * item.quantity
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        discountApplied: customer.subscription,
      }
    })

    if (customer.subscription) {
      totalAmount = Math.round(totalAmount * 0.9)
    }

    // Generate Swish QR code
    const club = await prisma.club.findUnique({ where: { id: user.clubId } })
    const swishQrCode = await generateSwishQRCode({
      amount: totalAmount,
      message: formatSwishMessage(`ORDER-${Date.now()}`, club?.name || 'ForFor'),
    }).catch(() => undefined)

    const order = await prisma.order.create({
      data: {
        customerId,
        campaignId,
        teamId,
        sellerId: null,
        totalAmount,
        swishQrCode,
        status: status || 'OBETALD',
        comment: comment || null,
        source: 'SALES_REP',
        items: { create: orderItemsData },
        deliveries: { create: { status: 'EJ_HAMTAD' } },
      },
      include: { items: { include: { product: true } } },
    })

    revalidatePath('/admin/bestallningar')
    return NextResponse.json(order)
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
