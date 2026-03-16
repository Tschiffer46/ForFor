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
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'Namn är obligatoriskt' }, { status: 400 })
    }

    // Verify the lag group belongs to the user's club
    const existing = await prisma.lagGroup.findFirst({
      where: {
        id,
        ...(user.clubId ? { clubId: user.clubId } : {}),
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Lag hittades inte' }, { status: 404 })
    }

    const lagGroup = await prisma.lagGroup.update({
      where: { id },
      data: { name },
    })

    revalidatePath('/admin/lag')
    return NextResponse.json({ lagGroup })
  } catch (error) {
    console.error('Error updating lag group:', error)
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

    // Verify the lag group belongs to the user's club
    const existing = await prisma.lagGroup.findFirst({
      where: {
        id,
        ...(user.clubId ? { clubId: user.clubId } : {}),
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Lag hittades inte' }, { status: 404 })
    }

    await prisma.lagGroup.delete({
      where: { id },
    })

    revalidatePath('/admin/lag')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lag group:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
