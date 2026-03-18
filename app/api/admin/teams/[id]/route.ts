import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcrypt'

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
    const { name, username, password } = body

    // Verify the team's lagGroup belongs to the user's club
    const existing = await prisma.team.findFirst({
      where: {
        id,
        lagGroup: {
          ...(user.clubId ? { clubId: user.clubId } : {}),
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Laget hittades inte' },
        { status: 404 }
      )
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (username !== undefined) data.username = username
    if (password) data.password = await bcrypt.hash(password, 10)

    const team = await prisma.team.update({
      where: { id },
      data,
    })

    revalidatePath('/admin/lag')
    return NextResponse.json({ team })
  } catch (error) {
    console.error('Error updating team:', error)
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

    // Verify the team's lagGroup belongs to the user's club
    const existing = await prisma.team.findFirst({
      where: {
        id,
        lagGroup: {
          ...(user.clubId ? { clubId: user.clubId } : {}),
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Laget hittades inte' },
        { status: 404 }
      )
    }

    await prisma.team.delete({
      where: { id },
    })

    revalidatePath('/admin/lag')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
