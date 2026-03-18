import { NextRequest, NextResponse } from 'next/server'
import { requireOrgAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const VALID_ROLES = ['ordforande', 'forsaljningsansvarig', 'nyckelperson_1', 'nyckelperson_2', 'nyckelperson_3']

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

    const keyPersons = await prisma.clubKeyPerson.findMany({
      where: { clubId: club.id },
      orderBy: { role: 'asc' },
    })

    return NextResponse.json({ keyPersons })
  } catch (error) {
    console.error('Error fetching key persons:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

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
    const { keyPersons } = body as { keyPersons: Array<{ role: string; name: string; email?: string; phone?: string }> }

    if (!Array.isArray(keyPersons)) {
      return NextResponse.json({ error: 'keyPersons måste vara en array' }, { status: 400 })
    }

    // Validate roles
    for (const kp of keyPersons) {
      if (!VALID_ROLES.includes(kp.role)) {
        return NextResponse.json({ error: `Ogiltig roll: ${kp.role}` }, { status: 400 })
      }
    }

    // Upsert all key persons in a transaction
    await prisma.$transaction(
      keyPersons.map((kp) =>
        prisma.clubKeyPerson.upsert({
          where: { clubId_role: { clubId: club.id, role: kp.role } },
          create: {
            clubId: club.id,
            role: kp.role,
            name: kp.name,
            email: kp.email || null,
            phone: kp.phone || null,
          },
          update: {
            name: kp.name,
            email: kp.email || null,
            phone: kp.phone || null,
          },
        })
      )
    )

    const updated = await prisma.clubKeyPerson.findMany({
      where: { clubId: club.id },
      orderBy: { role: 'asc' },
    })

    revalidatePath(`/admin/klubbar/${slug}`)
    return NextResponse.json({ keyPersons: updated })
  } catch (error) {
    console.error('Error updating key persons:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
