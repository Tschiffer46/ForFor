import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcrypt'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const members = await prisma.user.findMany({
      where: {
        role: 'TEAM_MEMBER',
        ...(user.clubId ? { clubId: user.clubId } : {}),
      },
      include: {
        team: true,
        club: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error listing team members:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, username, password, teamId, phone, email } = body

    if (!name || !username || !password || !teamId) {
      return NextResponse.json(
        { error: 'Namn, användarnamn, lösenord och lag är obligatoriska' },
        { status: 400 }
      )
    }

    // Verify the team belongs to the user's club
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

    // Check for duplicate username
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Användarnamnet är redan taget' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const member = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role: 'TEAM_MEMBER',
        teamId,
        clubId: user.clubId,
        phone: phone || null,
        email: email || null,
      },
      include: {
        team: true,
      },
    })

    revalidatePath('/admin/lag')
    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error('Error creating team member:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
