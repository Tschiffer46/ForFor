import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DeliveryStatus } from '@prisma/client'

export async function PATCH(
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
    const { status, notes } = body

    // Verify the delivery belongs to user's club
    const delivery = await prisma.delivery.findFirst({
      where: {
        id,
        order: {
          team: {
            lagGroup: {
              ...(user.clubId ? { clubId: user.clubId } : {}),
            },
          },
        },
      },
    })

    if (!delivery) {
      return NextResponse.json({ error: 'Leverans hittades inte' }, { status: 404 })
    }

    const data: { status?: DeliveryStatus; notes?: string } = {}
    if (status && Object.values(DeliveryStatus).includes(status)) {
      data.status = status
    }
    if (notes !== undefined) {
      data.notes = notes
    }

    const updated = await prisma.delivery.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating delivery:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
