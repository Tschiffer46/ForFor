import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, lagGroupId, username, password } = body

    if (!name || !lagGroupId) {
      return NextResponse.json(
        { error: 'Namn och laggrupp är obligatoriska' },
        { status: 400 }
      )
    }

    // Verify the lagGroup belongs to the user's club
    const lagGroup = await prisma.lagGroup.findFirst({
      where: {
        id: lagGroupId,
        ...(user.clubId ? { clubId: user.clubId } : {}),
      },
    })

    if (!lagGroup) {
      return NextResponse.json(
        { error: 'Laggruppen hittades inte' },
        { status: 404 }
      )
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined

    const team = await prisma.team.create({
      data: {
        name,
        lagGroupId,
        username: username || undefined,
        password: hashedPassword,
      },
    })

    revalidatePath('/admin/lag')
    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
