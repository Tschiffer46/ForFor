import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.clubId) {
      return NextResponse.json({ error: 'No club assigned' }, { status: 400 })
    }

    const lagGroups = await prisma.lagGroup.findMany({
      where: {
        clubId: user.clubId,
      },
      include: {
        teams: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ lagGroups })
  } catch (error) {
    console.error('Error fetching lag groups:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.clubId) {
      return NextResponse.json({ error: 'No club assigned' }, { status: 400 })
    }

    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'Namn ar obligatoriskt' }, { status: 400 })
    }

    const lagGroup = await prisma.lagGroup.create({
      data: {
        name,
        clubId: user.clubId,
      },
    })

    revalidatePath('/admin/lag')
    return NextResponse.json({ lagGroup }, { status: 201 })
  } catch (error) {
    console.error('Error creating lag group:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
