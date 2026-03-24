import { NextRequest, NextResponse } from 'next/server'
import { requireOrgAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; adminId: string }> }
) {
  try {
    const user = await requireOrgAdmin()
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, adminId } = await params
    const club = await prisma.club.findFirst({
      where: { slug, organizationId: user.organizationId },
    })
    if (!club) {
      return NextResponse.json({ error: 'Klubb hittades inte' }, { status: 404 })
    }

    // Verify admin belongs to this club
    const admin = await prisma.user.findFirst({
      where: { id: adminId, clubId: club.id, role: 'CLUB_ADMIN' },
    })
    if (!admin) {
      return NextResponse.json({ error: 'Administratör hittades inte' }, { status: 404 })
    }

    await prisma.user.delete({ where: { id: adminId } })

    revalidatePath(`/admin/klubbar/${slug}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting club admin:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
