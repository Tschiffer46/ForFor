import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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
    const { name, salesStart, salesEnd, deliveryStart } = body

    if (!name || !salesStart || !salesEnd) {
      return NextResponse.json({ error: 'Namn och försäljningsdatum är obligatoriska' }, { status: 400 })
    }

    // Verify the campaign belongs to the user's club
    const existing = await prisma.campaign.findFirst({
      where: {
        id,
        ...(user.clubId ? { clubId: user.clubId } : {}),
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Kampanj hittades inte' }, { status: 404 })
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        name,
        salesStart: new Date(salesStart),
        salesEnd: new Date(salesEnd),
        deliveryStart: deliveryStart ? new Date(deliveryStart) : null,
      },
    })

    revalidatePath('/admin/saljrundor')
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

    // Verify the campaign belongs to the user's club
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

    revalidatePath('/admin/saljrundor')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
