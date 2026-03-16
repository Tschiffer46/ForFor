import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSwishQRCode, formatSwishMessage } from '@/lib/swish'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'TEAM_MEMBER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { customerId, items } = body

    if (!customerId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer ID and items required' },
        { status: 400 }
      )
    }

    // Get customer to check for subscription
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get current campaign
    const currentCampaign = await prisma.campaign.findFirst({
      where: {
        clubId: user.clubId!,
        salesStart: { lte: new Date() },
        salesEnd: { gte: new Date() },
      },
    })

    if (!currentCampaign) {
      return NextResponse.json(
        { error: 'No active campaign' },
        { status: 400 }
      )
    }

    // Get products and calculate total
    const products = await prisma.product.findMany({
      where: {
        id: { in: items.map((item: { productId: string; quantity: number }) => item.productId) },
      },
    })

    let totalAmount = 0
    const orderItemsData = items.map((item: { productId: string; quantity: number }) => {
      const product = products.find(p => p.id === item.productId)
      if (!product) {
        throw new Error(`Product ${item.productId} not found`)
      }

      const itemTotal = product.price * item.quantity
      totalAmount += itemTotal

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        discountApplied: customer.subscription,
      }
    })

    // Apply discount if customer has subscription
    if (customer.subscription) {
      totalAmount = Math.round(totalAmount * 0.9)
    }

    // Generate Swish QR code
    const club = await prisma.club.findUnique({
      where: { id: user.clubId! },
    })

    const swishQrCode = await generateSwishQRCode({
      amount: totalAmount,
      message: formatSwishMessage(`ORDER-${Date.now()}`, club?.name || 'ForFor'),
    }).catch((error) => {
      console.error('Error generating Swish QR code:', error)
      return undefined
    })

    // Create order
    const order = await prisma.order.create({
      data: {
        customerId,
        campaignId: currentCampaign.id,
        sellerId: user.id,
        teamId: user.teamId!,
        totalAmount,
        swishQrCode,
        status: 'OBETALD',
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
