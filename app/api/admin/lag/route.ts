import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.roll !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teams = await prisma.lag.findMany({
      where: {
        foreningId: user.foreningId,
      },
      orderBy: {
        namn: 'asc',
      },
    })

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.roll !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { namn } = body

    if (!namn) {
      return NextResponse.json({ error: 'Namn är obligatoriskt' }, { status: 400 })
    }

    const team = await prisma.lag.create({
      data: {
        namn,
        foreningId: user.foreningId,
      },
    })

    revalidatePath('/admin/lag')
    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
