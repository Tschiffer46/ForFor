import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.roll !== 'TEAM_MEMBER' || !user.lagId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addresses = await prisma.adress.findMany({
      where: {
        gata: {
          lagId: user.lagId,
        },
      },
      include: {
        gata: true,
      },
      orderBy: {
        gatuadress: 'asc',
      },
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
