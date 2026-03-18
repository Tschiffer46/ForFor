import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'TEAM_MEMBER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const products = await prisma.product.findMany({
      where: {
        active: true,
        archived: false,
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
