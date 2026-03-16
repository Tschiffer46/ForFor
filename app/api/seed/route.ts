import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  // Simple protection so not anyone can trigger this
  if (secret !== 'forfor2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Clear existing data
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.address.deleteMany()
    await prisma.street.deleteMany()
    await prisma.district.deleteMany()
    await prisma.campaignProduct.deleteMany()
    await prisma.campaign.deleteMany()
    await prisma.user.deleteMany()
    await prisma.team.deleteMany()
    await prisma.lagGroup.deleteMany()
    await prisma.product.deleteMany()
    await prisma.club.deleteMany()
    await prisma.organization.deleteMany()

    // Create Organization (AZ Profil)
    const organization = await prisma.organization.create({
      data: {
        name: 'AZ Profil',
      },
    })

    // Create Club
    const club = await prisma.club.create({
      data: {
        name: 'Exempel Sportklubb',
        slug: 'exempel-sportklubb',
        sport: 'Fotboll',
        organizationId: organization.id,
      },
    })

    // Create Products (belong to Organization)
    const products = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Lambi Hushallspapper (sack)',
          description: 'Hogkvalitativt hushallspapper i sack',
          price: 299,
          organizationId: organization.id,
        },
      }),
      prisma.product.create({
        data: {
          name: 'Lambi Toapapper (sack)',
          description: 'Mjukt och starkt toapapper i sack',
          price: 279,
          organizationId: organization.id,
        },
      }),
      prisma.product.create({
        data: {
          name: 'Serla Hushallspapper (sack)',
          description: 'Prisvart hushallspapper i sack',
          price: 249,
          organizationId: organization.id,
        },
      }),
      prisma.product.create({
        data: {
          name: 'Serla Toapapper (sack)',
          description: 'Prisvart toapapper i sack',
          price: 229,
          organizationId: organization.id,
        },
      }),
    ])

    // Create LagGroup
    const lagGroup = await prisma.lagGroup.create({
      data: {
        name: 'Pojkar 2012',
        clubId: club.id,
      },
    })

    // Create Teams
    const teamA = await prisma.team.create({
      data: {
        name: 'Lag A',
        lagGroupId: lagGroup.id,
      },
    })

    const teamB = await prisma.team.create({
      data: {
        name: 'Lag B',
        lagGroupId: lagGroup.id,
      },
    })

    // Create Campaign
    const today = new Date()
    const nextMonth = new Date(today)
    nextMonth.setMonth(today.getMonth() + 1)
    const deliveryDate = new Date(today)
    deliveryDate.setMonth(today.getMonth() + 2)

    const campaign = await prisma.campaign.create({
      data: {
        name: 'Varforsaljning 2026',
        salesStart: today,
        salesEnd: nextMonth,
        deliveryStart: deliveryDate,
        clubId: club.id,
      },
    })

    // Create ORG_ADMIN User
    const orgAdmin = await prisma.user.create({
      data: {
        name: 'Org Admin',
        email: 'orgadmin@exempel.se',
        username: 'orgadmin',
        password: 'placeholder',
        role: 'ORG_ADMIN',
        organizationId: organization.id,
      },
    })

    // Create CLUB_ADMIN User
    const clubAdmin = await prisma.user.create({
      data: {
        name: 'Klubb Admin',
        email: 'admin@exempel.se',
        username: 'klubbadmin',
        password: 'placeholder',
        role: 'CLUB_ADMIN',
        organizationId: organization.id,
        clubId: club.id,
      },
    })

    // Create Team Members
    const teamMember1 = await prisma.user.create({
      data: {
        name: 'Emma Andersson',
        email: 'emma@exempel.se',
        username: 'emma',
        password: 'placeholder',
        role: 'TEAM_MEMBER',
        organizationId: organization.id,
        clubId: club.id,
        teamId: teamA.id,
      },
    })

    const teamMember2 = await prisma.user.create({
      data: {
        name: 'Erik Johansson',
        email: 'erik@exempel.se',
        username: 'erik',
        password: 'placeholder',
        role: 'TEAM_MEMBER',
        organizationId: organization.id,
        clubId: club.id,
        teamId: teamB.id,
      },
    })

    // Create Districts
    const districtA = await prisma.district.create({
      data: {
        name: 'Distrikt Ost',
        teamId: teamA.id,
      },
    })

    const districtB = await prisma.district.create({
      data: {
        name: 'Distrikt Vast',
        teamId: teamB.id,
      },
    })

    // Create Streets and Addresses for Team A
    const streetStorgatan = await prisma.street.create({
      data: {
        name: 'Storgatan',
        city: 'Stockholm',
        districtId: districtA.id,
      },
    })

    const addresses1 = await Promise.all([
      prisma.address.create({
        data: {
          street: 'Storgatan 1',
          postalCode: '11122',
          city: 'Stockholm',
          streetId: streetStorgatan.id,
        },
      }),
      prisma.address.create({
        data: {
          street: 'Storgatan 3',
          postalCode: '11122',
          city: 'Stockholm',
          streetId: streetStorgatan.id,
        },
      }),
      prisma.address.create({
        data: {
          street: 'Storgatan 5',
          postalCode: '11122',
          city: 'Stockholm',
          streetId: streetStorgatan.id,
        },
      }),
    ])

    // Create Streets and Addresses for Team B
    const streetKungsgatan = await prisma.street.create({
      data: {
        name: 'Kungsgatan',
        city: 'Stockholm',
        districtId: districtB.id,
      },
    })

    const addresses2 = await Promise.all([
      prisma.address.create({
        data: {
          street: 'Kungsgatan 10',
          postalCode: '11143',
          city: 'Stockholm',
          streetId: streetKungsgatan.id,
        },
      }),
      prisma.address.create({
        data: {
          street: 'Kungsgatan 12',
          postalCode: '11143',
          city: 'Stockholm',
          streetId: streetKungsgatan.id,
        },
      }),
    ])

    // Create sample customers
    const customer1 = await prisma.customer.create({
      data: {
        name: 'Anna Svensson',
        phone: '070-3333333',
        email: 'anna@exempel.se',
        subscription: true,
        addressId: addresses1[0].id,
      },
    })

    const customer2 = await prisma.customer.create({
      data: {
        name: 'Lars Pettersson',
        phone: '070-4444444',
        subscription: false,
        addressId: addresses1[1].id,
      },
    })

    const customer3 = await prisma.customer.create({
      data: {
        name: 'Maria Nilsson',
        phone: '070-5555555',
        email: 'maria@exempel.se',
        subscription: false,
        addressId: addresses2[0].id,
      },
    })

    // Create sample orders
    await prisma.order.create({
      data: {
        status: 'BETALD',
        totalAmount: 269,
        customerId: customer1.id,
        campaignId: campaign.id,
        sellerId: teamMember1.id,
        teamId: teamA.id,
        items: {
          create: [
            {
              quantity: 1,
              unitPrice: 299,
              discountApplied: true,
              productId: products[0].id,
            },
          ],
        },
      },
    })

    await prisma.order.create({
      data: {
        status: 'OBETALD',
        totalAmount: 528,
        customerId: customer2.id,
        campaignId: campaign.id,
        sellerId: teamMember1.id,
        teamId: teamA.id,
        items: {
          create: [
            {
              quantity: 1,
              unitPrice: 279,
              discountApplied: false,
              productId: products[1].id,
            },
            {
              quantity: 1,
              unitPrice: 249,
              discountApplied: false,
              productId: products[2].id,
            },
          ],
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Databas populerad med testdata!',
      data: {
        organization: organization.name,
        club: club.name,
        products: products.length,
        teams: [teamA.name, teamB.name],
        orgAdmin: orgAdmin.email,
        clubAdmin: clubAdmin.email,
        teamMembers: [teamMember1.email, teamMember2.email],
        streets: ['Storgatan', 'Kungsgatan'],
        customers: [customer1.name, customer2.name, customer3.name],
        campaign: campaign.name,
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
