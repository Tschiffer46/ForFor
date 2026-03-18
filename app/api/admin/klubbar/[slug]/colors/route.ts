import { NextRequest, NextResponse } from 'next/server'
import { requireOrgAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await requireOrgAdmin()
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const club = await prisma.club.findFirst({
      where: { slug, organizationId: user.organizationId },
    })
    if (!club) {
      return NextResponse.json({ error: 'Klubb hittades inte' }, { status: 404 })
    }

    const body = await request.json()
    const { color1, color2, color3, color4 } = body

    await prisma.club.update({
      where: { id: club.id },
      data: {
        ...(color1 !== undefined && { color1 }),
        ...(color2 !== undefined && { color2 }),
        ...(color3 !== undefined && { color3 }),
        ...(color4 !== undefined && { color4 }),
      },
    })

    revalidatePath(`/admin/klubbar/${slug}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating club colors:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
