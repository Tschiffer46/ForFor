import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const customerNumber = request.nextUrl.searchParams.get('customerNumber')

    if (!customerNumber) {
      return NextResponse.json(
        { error: 'Kundnummer saknas' },
        { status: 400 }
      )
    }

    // Find the club by slug
    const club = await prisma.club.findUnique({
      where: { slug },
    })

    if (!club) {
      return NextResponse.json(
        { error: 'Klubb hittades inte' },
        { status: 404 }
      )
    }

    // Find customer by customer number and verify they belong to this club
    const customer = await prisma.customer.findUnique({
      where: { customerNumber },
      include: {
        address: {
          include: {
            streetRef: {
              include: {
                district: {
                  include: {
                    team: {
                      include: {
                        lagGroup: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Kund hittades inte' },
        { status: 404 }
      )
    }

    // Verify customer belongs to this club
    if (customer.address.streetRef.district.team.lagGroup.clubId !== club.id) {
      return NextResponse.json(
        { error: 'Kund hittades inte' },
        { status: 404 }
      )
    }

    // Return only safe fields
    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      address: {
        street: customer.address.street,
        postalCode: customer.address.postalCode,
        city: customer.address.city,
      },
    })
  } catch (error) {
    console.error('Error looking up customer:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
