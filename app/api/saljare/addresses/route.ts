import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'TEAM_MEMBER' || !user.teamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addresses = await prisma.address.findMany({
      where: {
        streetRef: {
          district: {
            teamId: user.teamId,
          },
        },
      },
      include: {
        streetRef: true,
      },
      orderBy: {
        street: 'asc',
      },
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
