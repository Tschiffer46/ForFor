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
    const { name, username, password, phone, email, teamId } = body

    // Verify the member belongs to the user's club
    const existing = await prisma.user.findFirst({
      where: {
        id,
        role: 'TEAM_MEMBER',
        ...(user.clubId ? { clubId: user.clubId } : {}),
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Lagmedlemmen hittades inte' },
        { status: 404 }
      )
    }

    // If teamId is being changed, verify the new team belongs to the club
    if (teamId) {
      const team = await prisma.team.findFirst({
        where: {
          id: teamId,
          lagGroup: {
            ...(user.clubId ? { clubId: user.clubId } : {}),
          },
        },
      })

      if (!team) {
        return NextResponse.json(
          { error: 'Laget hittades inte eller tillhör inte din förening' },
          { status: 404 }
        )
      }
    }

    // If username is being changed, check for duplicates
    if (username && username !== existing.username) {
      const duplicate = await prisma.user.findUnique({
        where: { username },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Användarnamnet är redan taget' },
          { status: 409 }
        )
      }
    }

    // Build update data
    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (username !== undefined) data.username = username
    if (phone !== undefined) data.phone = phone || null
    if (email !== undefined) data.email = email || null
    if (teamId !== undefined) data.teamId = teamId
    if (password) {
      data.password = await bcrypt.hash(password, 10)
    }

    const member = await prisma.user.update({
      where: { id },
      data,
      include: {
        team: true,
      },
    })

    revalidatePath('/admin/lag')
    return NextResponse.json({ member })
  } catch (error) {
    console.error('Error updating team member:', error)
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

    // Verify the member belongs to the user's club
    const existing = await prisma.user.findFirst({
      where: {
        id,
        role: 'TEAM_MEMBER',
        ...(user.clubId ? { clubId: user.clubId } : {}),
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Lagmedlemmen hittades inte' },
        { status: 404 }
      )
    }

    await prisma.user.delete({
      where: { id },
    })

    revalidatePath('/admin/lag')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting team member:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
