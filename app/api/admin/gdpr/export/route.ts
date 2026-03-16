import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ORG_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clubId = request.nextUrl.searchParams.get('clubId')

    if (!clubId) {
      return NextResponse.json(
        { error: 'clubId query parameter is required' },
        { status: 400 }
      )
    }

    // Verify the club belongs to the user's organization
    const club = await prisma.club.findFirst({
      where: {
        id: clubId,
        ...(user.organizationId
          ? { organizationId: user.organizationId }
          : {}),
      },
      select: { id: true, name: true },
    })

    if (!club) {
      return NextResponse.json(
        { error: 'Klubb hittades inte' },
        { status: 404 }
      )
    }

    // Fetch all customers with addresses belonging to this club
    const customers = await prisma.customer.findMany({
      where: {
        address: {
          streetRef: {
            district: {
              team: {
                lagGroup: {
                  clubId,
                },
              },
            },
          },
        },
      },
      include: {
        address: true,
        orders: {
          include: {
            items: {
              include: {
                product: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    })

    // Fetch all users belonging to this club
    const users = await prisma.user.findMany({
      where: { clubId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        username: true,
        role: true,
        createdAt: true,
      },
    })

    // Fetch all addresses belonging to this club
    const addresses = await prisma.address.findMany({
      where: {
        streetRef: {
          district: {
            team: {
              lagGroup: {
                clubId,
              },
            },
          },
        },
      },
      include: {
        streetRef: {
          select: { name: true, city: true },
        },
        visits: {
          select: {
            id: true,
            result: true,
            notes: true,
            createdAt: true,
          },
        },
      },
    })

    const exportData = {
      exportedAt: new Date().toISOString(),
      club: club.name,
      clubId: club.id,
      customers: customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        subscription: c.subscription,
        address: {
          street: c.address.street,
          postalCode: c.address.postalCode,
          city: c.address.city,
        },
        orders: c.orders.map((o) => ({
          id: o.id,
          status: o.status,
          totalAmount: o.totalAmount,
          createdAt: o.createdAt,
          items: o.items.map((i) => ({
            product: i.product.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        })),
        createdAt: c.createdAt,
      })),
      addresses: addresses.map((a) => ({
        id: a.id,
        street: a.street,
        postalCode: a.postalCode,
        city: a.city,
        streetName: a.streetRef.name,
        visits: a.visits,
      })),
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        username: u.username,
        role: u.role,
        createdAt: u.createdAt,
      })),
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('GDPR export error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
