import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSwishQRCode, formatSwishMessage } from '@/lib/swish'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.roll !== 'TEAM_MEMBER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { kundId, items } = body

    if (!kundId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer ID and items required' },
        { status: 400 }
      )
    }

    // Get customer to check for subscription
    const customer = await prisma.kund.findUnique({
      where: { id: kundId },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get current order round
    const currentRound = await prisma.saljrunda.findFirst({
      where: {
        foreningId: user.foreningId,
        forsaljningStart: { lte: new Date() },
        forsaljningSlut: { gte: new Date() },
      },
    })

    if (!currentRound) {
      return NextResponse.json(
        { error: 'No active order round' },
        { status: 400 }
      )
    }

    // Get products and calculate total
    const products = await prisma.produkt.findMany({
      where: {
        id: { in: items.map((item: { produktId: string; antal: number }) => item.produktId) },
      },
    })

    let totalBelopp = 0
    const orderItemsData = items.map((item: { produktId: string; antal: number }) => {
      const product = products.find(p => p.id === item.produktId)
      if (!product) {
        throw new Error(`Product ${item.produktId} not found`)
      }
      
      const itemTotal = product.pris * item.antal
      totalBelopp += itemTotal
      
      return {
        produktId: item.produktId,
        antal: item.antal,
        styckpris: product.pris,
        rabattTillampad: customer.prenumeration,
      }
    })

    // Apply discount if customer has subscription
    if (customer.prenumeration) {
      totalBelopp = Math.round(totalBelopp * 0.9)
    }

    // Generate Swish QR code
    const forening = await prisma.forening.findUnique({
      where: { id: user.foreningId },
    })

    const swishQrCode = await generateSwishQRCode({
      amount: totalBelopp,
      message: formatSwishMessage(`ORDER-${Date.now()}`, forening?.name || 'ForFor'),
    }).catch((error) => {
      console.error('Error generating Swish QR code:', error)
      return undefined
    })

    // Create order
    const order = await prisma.order.create({
      data: {
        kundId,
        saljrundaId: currentRound.id,
        saljareId: user.id,
        totalBelopp,
        swishQrCode,
        status: 'OBETALD',
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        orderItems: {
          include: {
            produkt: true,
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
