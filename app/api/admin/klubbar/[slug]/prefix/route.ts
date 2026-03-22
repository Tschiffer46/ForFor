import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ORG_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const { prefix } = await request.json()

    await prisma.club.update({
      where: { slug },
      data: { prefix: prefix || null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating club prefix:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
