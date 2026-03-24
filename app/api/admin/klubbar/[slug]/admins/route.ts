import { NextRequest, NextResponse } from 'next/server'
import { requireOrgAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcrypt'
import { revalidatePath } from 'next/cache'

export async function GET(
  _request: NextRequest,
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

    const admins = await prisma.user.findMany({
      where: { clubId: club.id, role: 'CLUB_ADMIN' },
      select: { id: true, name: true, username: true, email: true, phone: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ admins })
  } catch (error) {
    console.error('Error fetching club admins:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(
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
    const { name, username, password, email, phone } = body as {
      name: string
      username: string
      password: string
      email?: string
      phone?: string
    }

    if (!name?.trim() || !username?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: 'Namn, användarnamn och lösenord krävs' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Lösenordet måste vara minst 6 tecken' },
        { status: 400 }
      )
    }

    // Check username uniqueness
    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Användarnamnet är redan taget' },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 10)

    const admin = await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.toLowerCase().trim(),
        password: hashedPassword,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        role: 'CLUB_ADMIN',
        clubId: club.id,
        organizationId: club.organizationId,
      },
      select: { id: true, name: true, username: true, email: true, phone: true },
    })

    revalidatePath(`/admin/klubbar/${slug}`)
    return NextResponse.json({ admin }, { status: 201 })
  } catch (error) {
    console.error('Error creating club admin:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
