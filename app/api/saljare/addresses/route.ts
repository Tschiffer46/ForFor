import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'TEAM_MEMBER' || !user.teamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    const addresses = await prisma.address.findMany({
      where: {
        streetRef: {
          district: {
            teamId: user.teamId,
          },
        },
        ...(query
          ? {
              street: {
                contains: query,
                mode: 'insensitive' as const,
              },
            }
          : {}),
      },
      include: {
        streetRef: true,
        customers: {
          include: {
            orders: {
              take: 3,
              orderBy: { createdAt: 'desc' },
              include: {
                items: {
                  include: { product: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        street: 'asc',
      },
      ...(query ? { take: 20 } : {}),
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
