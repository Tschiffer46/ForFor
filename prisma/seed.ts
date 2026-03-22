import { PrismaClient, UserRole, OrderStatus, CampaignStatus } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clear all tables
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.delivery.deleteMany()
  await prisma.addressVisit.deleteMany()
  await prisma.campaignProduct.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.address.deleteMany()
  await prisma.street.deleteMany()
  await prisma.district.deleteMany()
  await prisma.user.deleteMany()
  await prisma.team.deleteMany()
  await prisma.lagGroup.deleteMany()
  await prisma.club.deleteMany()
  await prisma.product.deleteMany()
  await prisma.organization.deleteMany()
  console.log('✅ Cleared existing data')

  // Hash passwords
  const adminPass = await hash('admin123', 10)
  const clubPass = await hash('club123', 10)
  const teamPass = await hash('team123', 10)

  // ── Organization ──
  const org = await prisma.organization.create({
    data: { name: 'AZ Profil' },
  })
  console.log('✅ Created organization:', org.name)

  // ── Products (org level) ──
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Lambi Toalettpapper',
        description: 'Mjukt och starkt toalettpapper, 48 rullar per säck',
        price: 279,
        active: true,
        organizationId: org.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Lambi Hushållspapper',
        description: 'Premium hushållspapper, 24 rullar per säck',
        price: 299,
        active: true,
        organizationId: org.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Serla Toalettpapper',
        description: 'Prisvärt toalettpapper, 48 rullar per säck',
        price: 229,
        active: true,
        organizationId: org.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Serla Hushållspapper',
        description: 'Prisvärt hushållspapper, 24 rullar per säck',
        price: 249,
        active: true,
        organizationId: org.id,
      },
    }),
  ])
  console.log('✅ Created', products.length, 'products')

  // ── Clubs ──
  const uppakra = await prisma.club.create({
    data: {
      name: 'Uppåkra IF',
      slug: 'uppakra-if',
      sport: 'Fotboll',
      address: 'Uppåkravägen 10',
      postalCode: '232 54',
      city: 'Uppåkra',
      contactEmail: 'kansliet@uif.nu',
      website: 'https://www.uif.nu',
      active: true,
      organizationId: org.id,
    },
  })

  const torns = await prisma.club.create({
    data: {
      name: 'Torns IF',
      slug: 'torns-if',
      sport: 'Fotboll',
      address: 'Tornvallen, Stångby',
      postalCode: '225 91',
      city: 'Lund',
      contactName: 'Joel Beckman',
      website: 'https://www.tornsif.se',
      active: true,
      organizationId: org.id,
    },
  })
  console.log('✅ Created clubs:', uppakra.name, 'and', torns.name)

  // ── LagGroups + Teams for Uppåkra ──
  const flickor08 = await prisma.lagGroup.create({
    data: {
      name: 'Flickor 08',
      clubId: uppakra.id,
    },
  })
  const pojkar09 = await prisma.lagGroup.create({
    data: {
      name: 'Pojkar 09',
      clubId: uppakra.id,
    },
  })

  const uppTeamA = await prisma.team.create({
    data: {
      name: 'Team A',
      username: 'uppakra-f08-a',
      password: teamPass,
      lagGroupId: flickor08.id,
    },
  })
  const uppTeamB = await prisma.team.create({
    data: {
      name: 'Team B',
      username: 'uppakra-f08-b',
      password: teamPass,
      lagGroupId: flickor08.id,
    },
  })
  const uppTeamC = await prisma.team.create({
    data: {
      name: 'Team A',
      username: 'uppakra-p09-a',
      password: teamPass,
      lagGroupId: pojkar09.id,
    },
  })
  console.log('✅ Created lag groups and teams for Uppåkra IF')

  // ── LagGroups + Teams for Torns ──
  const flickor10 = await prisma.lagGroup.create({
    data: {
      name: 'Flickor 10',
      clubId: torns.id,
    },
  })
  const tornsTeamA = await prisma.team.create({
    data: {
      name: 'Team A',
      username: 'torns-f10-a',
      password: teamPass,
      lagGroupId: flickor10.id,
    },
  })
  const tornsTeamB = await prisma.team.create({
    data: {
      name: 'Team B',
      username: 'torns-f10-b',
      password: teamPass,
      lagGroupId: flickor10.id,
    },
  })
  console.log('✅ Created lag groups and teams for Torns IF')

  // ── Districts + Streets + Addresses for Uppåkra Team A ──
  const districtNorra = await prisma.district.create({
    data: {
      name: 'Norra Uppåkra',
      teamId: uppTeamA.id,
    },
  })

  const storgatan = await prisma.street.create({
    data: {
      name: 'Storgatan',
      city: 'Uppåkra',
      districtId: districtNorra.id,
    },
  })

  const addresses = await Promise.all([
    prisma.address.create({
      data: { street: 'Storgatan 1', postalCode: '232 54', city: 'Uppåkra', streetId: storgatan.id },
    }),
    prisma.address.create({
      data: { street: 'Storgatan 3', postalCode: '232 54', city: 'Uppåkra', streetId: storgatan.id },
    }),
    prisma.address.create({
      data: { street: 'Storgatan 5', postalCode: '232 54', city: 'Uppåkra', streetId: storgatan.id },
    }),
    prisma.address.create({
      data: { street: 'Storgatan 7', postalCode: '232 54', city: 'Uppåkra', streetId: storgatan.id },
    }),
  ])

  const districtSodra = await prisma.district.create({
    data: {
      name: 'Södra Uppåkra',
      teamId: uppTeamB.id,
    },
  })

  const kyrkogatan = await prisma.street.create({
    data: {
      name: 'Kyrkogatan',
      city: 'Uppåkra',
      districtId: districtSodra.id,
    },
  })

  const addresses2 = await Promise.all([
    prisma.address.create({
      data: { street: 'Kyrkogatan 2', postalCode: '232 54', city: 'Uppåkra', streetId: kyrkogatan.id },
    }),
    prisma.address.create({
      data: { street: 'Kyrkogatan 4', postalCode: '232 54', city: 'Uppåkra', streetId: kyrkogatan.id },
    }),
  ])
  console.log('✅ Created districts, streets and addresses')

  // ── Customers ──
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Anna Svensson',
      phone: '070-1234567',
      email: 'anna@exempel.se',
      subscription: true,
      customerNumber: 'UPPAKRA-10001',
      addressId: addresses[0].id,
    },
  })
  const customer2 = await prisma.customer.create({
    data: {
      name: 'Lars Pettersson',
      phone: '070-2345678',
      subscription: false,
      customerNumber: 'UPPAKRA-10002',
      addressId: addresses[1].id,
    },
  })
  const customer3 = await prisma.customer.create({
    data: {
      name: 'Maria Nilsson',
      phone: '070-3456789',
      email: 'maria@exempel.se',
      subscription: false,
      customerNumber: 'UPPAKRA-10003',
      addressId: addresses2[0].id,
    },
  })
  console.log('✅ Created sample customers')

  // ── Campaign ──
  const today = new Date()
  const nextMonth = new Date(today)
  nextMonth.setMonth(today.getMonth() + 1)
  const deliveryStart = new Date(today)
  deliveryStart.setMonth(today.getMonth() + 2)

  const campaign = await prisma.campaign.create({
    data: {
      name: 'Vårförsäljning 2026',
      status: CampaignStatus.ACTIVE,
      salesStart: today,
      salesEnd: nextMonth,
      deliveryStart: deliveryStart,
      recurring: true,
      clubId: uppakra.id,
    },
  })

  // Add products to campaign
  await Promise.all(
    products.map((p) =>
      prisma.campaignProduct.create({
        data: { campaignId: campaign.id, productId: p.id },
      })
    )
  )
  console.log('✅ Created campaign:', campaign.name)

  // ── Users ──
  const orgAdmin = await prisma.user.create({
    data: {
      name: 'Gustav Admin',
      email: 'admin@azprofil.se',
      username: 'admin',
      password: adminPass,
      role: UserRole.ORG_ADMIN,
      organizationId: org.id,
    },
  })

  const clubAdmin1 = await prisma.user.create({
    data: {
      name: 'Klubbadmin Uppåkra',
      email: 'admin@uppakra.se',
      username: 'uppakra-admin',
      password: clubPass,
      role: UserRole.CLUB_ADMIN,
      organizationId: org.id,
      clubId: uppakra.id,
    },
  })

  const clubAdmin2 = await prisma.user.create({
    data: {
      name: 'Joel Beckman',
      email: 'joel@tornsif.se',
      username: 'torns-admin',
      password: clubPass,
      role: UserRole.CLUB_ADMIN,
      organizationId: org.id,
      clubId: torns.id,
    },
  })

  const seller1 = await prisma.user.create({
    data: {
      name: 'Emma Andersson',
      email: 'emma@exempel.se',
      username: 'emma',
      password: teamPass,
      role: UserRole.TEAM_MEMBER,
      organizationId: org.id,
      clubId: uppakra.id,
      teamId: uppTeamA.id,
    },
  })

  const seller2 = await prisma.user.create({
    data: {
      name: 'Erik Johansson',
      email: 'erik@exempel.se',
      username: 'erik',
      password: teamPass,
      role: UserRole.TEAM_MEMBER,
      organizationId: org.id,
      clubId: uppakra.id,
      teamId: uppTeamB.id,
    },
  })
  console.log('✅ Created users')

  // ── Sample Orders ──
  const order1 = await prisma.order.create({
    data: {
      status: OrderStatus.BETALD,
      totalAmount: 251, // 279 * 0.9 (subscription discount)
      customerId: customer1.id,
      campaignId: campaign.id,
      teamId: uppTeamA.id,
      sellerId: seller1.id,
      items: {
        create: [{
          quantity: 1,
          unitPrice: 279,
          discountApplied: true,
          productId: products[0].id,
        }],
      },
    },
  })

  const order2 = await prisma.order.create({
    data: {
      status: OrderStatus.OBETALD,
      totalAmount: 528,
      customerId: customer2.id,
      campaignId: campaign.id,
      teamId: uppTeamA.id,
      sellerId: seller1.id,
      items: {
        create: [
          { quantity: 1, unitPrice: 279, discountApplied: false, productId: products[0].id },
          { quantity: 1, unitPrice: 249, discountApplied: false, productId: products[3].id },
        ],
      },
    },
  })
  console.log('✅ Created sample orders')

  console.log('')
  console.log('🎉 Seed completed!')
  console.log('')
  console.log('Login credentials:')
  console.log('  AZ Profil admin:  username: admin      password: admin123')
  console.log('  Uppåkra admin:    username: uppakra-admin  password: club123')
  console.log('  Torns admin:      username: torns-admin    password: club123')
  console.log('  Säljare Emma:     username: emma        password: team123')
  console.log('  Säljare Erik:     username: erik        password: team123')
  console.log('  Team login:       username: uppakra-f08-a  password: team123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
