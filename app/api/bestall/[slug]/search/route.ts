import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public endpoint: search customers by street address or customer number
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const q = request.nextUrl.searchParams.get('q')?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const club = await prisma.club.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (!club) {
      return NextResponse.json({ error: 'Klubb hittades inte' }, { status: 404 })
    }

    // Search customers by name, street address, or customer number
    const customers = await prisma.customer.findMany({
      where: {
        address: {
          streetRef: {
            district: {
              team: {
                lagGroup: { clubId: club.id },
              },
            },
          },
        },
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { customerNumber: { contains: q, mode: 'insensitive' } },
          { address: { street: { contains: q, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        name: true,
        customerNumber: true,
        subscription: true,
        email: true,
        phone: true,
        address: {
          select: { street: true, postalCode: true, city: true },
        },
      },
      take: 10,
    })

    return NextResponse.json({
      results: customers.map((c) => ({
        id: c.id,
        name: c.name,
        customerNumber: c.customerNumber,
        subscription: c.subscription,
        email: c.email,
        phone: c.phone,
        address: c.address,
      })),
    })
  } catch (error) {
    console.error('Error searching customers:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
