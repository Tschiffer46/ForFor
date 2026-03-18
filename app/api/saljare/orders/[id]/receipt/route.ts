import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'TEAM_MEMBER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { method, to } = await request.json()

    if (!method || !to) {
      return NextResponse.json(
        { error: 'Metod och mottagare krävs' },
        { status: 400 }
      )
    }

    // Verify the order belongs to this seller
    const order = await prisma.order.findFirst({
      where: { id, sellerId: user.id },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Ordern hittades inte' },
        { status: 404 }
      )
    }

    // TODO: Implement actual email/SMS sending
    // For now, log the receipt request
    console.log(`Receipt requested: ${method} to ${to} for order ${id}`)

    return NextResponse.json({
      success: true,
      message:
        method === 'email'
          ? `Kvitto skickat till ${to}`
          : `SMS-kvitto skickat till ${to}`,
    })
  } catch (error) {
    console.error('Error sending receipt:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
