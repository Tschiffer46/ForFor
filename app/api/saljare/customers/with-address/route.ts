import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateCustomerNumber } from '@/lib/customer-number'

// Create a new customer with a new address under the team's first street
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'TEAM_MEMBER' || !user.teamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { customerName, phone, email, streetAddress, postalCode, city } = body

    if (!customerName || !streetAddress) {
      return NextResponse.json(
        { error: 'Kundnamn och gatuadress krävs' },
        { status: 400 }
      )
    }

    // Find the team's first street to attach the address to
    const district = await prisma.district.findFirst({
      where: { teamId: user.teamId },
      include: {
        streets: { take: 1 },
      },
    })

    if (!district || district.streets.length === 0) {
      return NextResponse.json(
        { error: 'Ditt lag har inga gator tilldelade' },
        { status: 400 }
      )
    }

    const streetId = district.streets[0].id

    // Look up clubId from team
    const team = await prisma.team.findFirst({
      where: { id: user.teamId },
      include: { lagGroup: true },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 400 })
    }

    const customerNumber = await generateCustomerNumber(team.lagGroup.clubId)

    // Create address and customer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const address = await tx.address.create({
        data: {
          street: streetAddress,
          postalCode: postalCode || '',
          city: city || district.streets[0].city || '',
          streetId,
        },
      })

      const customer = await tx.customer.create({
        data: {
          name: customerName,
          phone: phone || null,
          email: email || null,
          subscription: false,
          customerNumber,
          addressId: address.id,
        },
      })

      return { address, customer }
    })

    return NextResponse.json({
      id: result.customer.id,
      name: result.customer.name,
      phone: result.customer.phone,
      email: result.customer.email,
      subscription: result.customer.subscription,
      orders: [],
      address: result.address,
    })
  } catch (error) {
    console.error('Error creating customer with address:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
