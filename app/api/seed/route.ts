import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== 'forfor2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Clear existing data
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.delivery.deleteMany()
    await prisma.addressVisit.deleteMany()
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

    // Hash passwords
    const adminPass = await hash('admin123', 10)
    const clubPass = await hash('club123', 10)
    const teamPass = await hash('team123', 10)

    // Organization
    const org = await prisma.organization.create({
      data: { name: 'AZ Profil' },
    })

    // Products
    const products = await Promise.all([
      prisma.product.create({
        data: { name: 'Lambi Toalettpapper', description: 'Mjukt och starkt toalettpapper, 48 rullar per säck', price: 279, active: true, organizationId: org.id },
      }),
      prisma.product.create({
        data: { name: 'Lambi Hushållspapper', description: 'Premium hushållspapper, 24 rullar per säck', price: 299, active: true, organizationId: org.id },
      }),
      prisma.product.create({
        data: { name: 'Serla Toalettpapper', description: 'Prisvärt toalettpapper, 48 rullar per säck', price: 229, active: true, organizationId: org.id },
      }),
      prisma.product.create({
        data: { name: 'Serla Hushållspapper', description: 'Prisvärt hushållspapper, 24 rullar per säck', price: 249, active: true, organizationId: org.id },
      }),
    ])

    // Clubs
    const uppakra = await prisma.club.create({
      data: {
        name: 'Uppåkra IF', slug: 'uppakra-if', sport: 'Fotboll',
        address: 'Uppåkravägen 10', postalCode: '232 54', city: 'Uppåkra',
        contactEmail: 'kansliet@uif.nu', website: 'https://www.uif.nu',
        active: true, organizationId: org.id,
      },
    })

    const torns = await prisma.club.create({
      data: {
        name: 'Torns IF', slug: 'torns-if', sport: 'Fotboll',
        address: 'Tornvallen, Stångby', postalCode: '225 91', city: 'Lund',
        contactName: 'Joel Beckman', website: 'https://www.tornsif.se',
        active: true, organizationId: org.id,
      },
    })

    // LagGroups + Teams for Uppåkra
    const flickor08 = await prisma.lagGroup.create({ data: { name: 'Flickor 08', clubId: uppakra.id } })
    const pojkar09 = await prisma.lagGroup.create({ data: { name: 'Pojkar 09', clubId: uppakra.id } })

    const uppTeamA = await prisma.team.create({ data: { name: 'Team A', username: 'uppakra-f08-a', password: teamPass, lagGroupId: flickor08.id } })
    const uppTeamB = await prisma.team.create({ data: { name: 'Team B', username: 'uppakra-f08-b', password: teamPass, lagGroupId: flickor08.id } })
    await prisma.team.create({ data: { name: 'Team A', username: 'uppakra-p09-a', password: teamPass, lagGroupId: pojkar09.id } })

    // LagGroups + Teams for Torns
    const flickor10 = await prisma.lagGroup.create({ data: { name: 'Flickor 10', clubId: torns.id } })
    await prisma.team.create({ data: { name: 'Team A', username: 'torns-f10-a', password: teamPass, lagGroupId: flickor10.id } })
    await prisma.team.create({ data: { name: 'Team B', username: 'torns-f10-b', password: teamPass, lagGroupId: flickor10.id } })

    // Districts + Streets + Addresses
    const districtNorra = await prisma.district.create({ data: { name: 'Norra Uppåkra', teamId: uppTeamA.id } })
    const storgatan = await prisma.street.create({ data: { name: 'Storgatan', city: 'Uppåkra', districtId: districtNorra.id } })

    const addresses = await Promise.all([
      prisma.address.create({ data: { street: 'Storgatan 1', postalCode: '232 54', city: 'Uppåkra', streetId: storgatan.id } }),
      prisma.address.create({ data: { street: 'Storgatan 3', postalCode: '232 54', city: 'Uppåkra', streetId: storgatan.id } }),
      prisma.address.create({ data: { street: 'Storgatan 5', postalCode: '232 54', city: 'Uppåkra', streetId: storgatan.id } }),
    ])

    const districtSodra = await prisma.district.create({ data: { name: 'Södra Uppåkra', teamId: uppTeamB.id } })
    const kyrkogatan = await prisma.street.create({ data: { name: 'Kyrkogatan', city: 'Uppåkra', districtId: districtSodra.id } })
    const addresses2 = await Promise.all([
      prisma.address.create({ data: { street: 'Kyrkogatan 2', postalCode: '232 54', city: 'Uppåkra', streetId: kyrkogatan.id } }),
      prisma.address.create({ data: { street: 'Kyrkogatan 4', postalCode: '232 54', city: 'Uppåkra', streetId: kyrkogatan.id } }),
    ])

    // Customers
    const customer1 = await prisma.customer.create({ data: { name: 'Anna Svensson', phone: '070-1234567', email: 'anna@exempel.se', subscription: true, customerNumber: 'UPPAKRA-10001', addressId: addresses[0].id } })
    const customer2 = await prisma.customer.create({ data: { name: 'Lars Pettersson', phone: '070-2345678', subscription: false, customerNumber: 'UPPAKRA-10002', addressId: addresses[1].id } })
    await prisma.customer.create({ data: { name: 'Maria Nilsson', phone: '070-3456789', email: 'maria@exempel.se', subscription: false, customerNumber: 'UPPAKRA-10003', addressId: addresses2[0].id } })

    // Campaign
    const today = new Date()
    const nextMonth = new Date(today)
    nextMonth.setMonth(today.getMonth() + 1)
    const deliveryStart = new Date(today)
    deliveryStart.setMonth(today.getMonth() + 2)

    const campaign = await prisma.campaign.create({
      data: {
        name: 'Vårförsäljning 2026', status: 'ACTIVE',
        salesStart: today, salesEnd: nextMonth, deliveryStart,
        recurring: true, clubId: uppakra.id,
      },
    })

    await Promise.all(products.map((p) =>
      prisma.campaignProduct.create({ data: { campaignId: campaign.id, productId: p.id } })
    ))

    // Users
    const orgAdmin = await prisma.user.create({
      data: { name: 'Gustav Admin', email: 'admin@azprofil.se', username: 'admin', password: adminPass, role: 'ORG_ADMIN', organizationId: org.id },
    })
    await prisma.user.create({
      data: { name: 'Klubbadmin Uppåkra', email: 'admin@uppakra.se', username: 'uppakra-admin', password: clubPass, role: 'CLUB_ADMIN', organizationId: org.id, clubId: uppakra.id },
    })
    await prisma.user.create({
      data: { name: 'Joel Beckman', email: 'joel@tornsif.se', username: 'torns-admin', password: clubPass, role: 'CLUB_ADMIN', organizationId: org.id, clubId: torns.id },
    })

    const seller1 = await prisma.user.create({
      data: { name: 'Emma Andersson', email: 'emma@exempel.se', username: 'emma', password: teamPass, role: 'TEAM_MEMBER', organizationId: org.id, clubId: uppakra.id, teamId: uppTeamA.id },
    })
    await prisma.user.create({
      data: { name: 'Erik Johansson', email: 'erik@exempel.se', username: 'erik', password: teamPass, role: 'TEAM_MEMBER', organizationId: org.id, clubId: uppakra.id, teamId: uppTeamB.id },
    })

    // Sample Orders
    await prisma.order.create({
      data: {
        status: 'BETALD', totalAmount: 251, customerId: customer1.id,
        campaignId: campaign.id, teamId: uppTeamA.id, sellerId: seller1.id,
        items: { create: [{ quantity: 1, unitPrice: 279, discountApplied: true, productId: products[0].id }] },
      },
    })
    await prisma.order.create({
      data: {
        status: 'OBETALD', totalAmount: 528, customerId: customer2.id,
        campaignId: campaign.id, teamId: uppTeamA.id, sellerId: seller1.id,
        items: { create: [
          { quantity: 1, unitPrice: 279, discountApplied: false, productId: products[0].id },
          { quantity: 1, unitPrice: 249, discountApplied: false, productId: products[3].id },
        ]},
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Databas populerad med testdata!',
      credentials: {
        orgAdmin: { username: 'admin', password: 'admin123' },
        clubAdminUppakra: { username: 'uppakra-admin', password: 'club123' },
        clubAdminTorns: { username: 'torns-admin', password: 'club123' },
        sellerEmma: { username: 'emma', password: 'team123' },
        sellerErik: { username: 'erik', password: 'team123' },
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
