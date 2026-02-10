import { PrismaClient, UserRole, OrderStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data
  await prisma.orderRad.deleteMany()
  await prisma.order.deleteMany()
  await prisma.kund.deleteMany()
  await prisma.adress.deleteMany()
  await prisma.gata.deleteMany()
  await prisma.anvandare.deleteMany()
  await prisma.saljrunda.deleteMany()
  await prisma.produkt.deleteMany()
  await prisma.lag.deleteMany()
  await prisma.forening.deleteMany()

  console.log('✅ Cleared existing data')

  // Create Förening (Club)
  const forening = await prisma.forening.create({
    data: {
      name: 'Exempel Sportklubb',
    },
  })
  console.log('✅ Created club:', forening.name)

  // Create Products
  const products = await Promise.all([
    prisma.produkt.create({
      data: {
        namn: 'Lambi Hushållspapper (säck)',
        beskrivning: 'Högkvalitativt hushållspapper i säck',
        pris: 299,
        foreningId: forening.id,
      },
    }),
    prisma.produkt.create({
      data: {
        namn: 'Lambi Toapapper (säck)',
        beskrivning: 'Mjukt och starkt toapapper i säck',
        pris: 279,
        foreningId: forening.id,
      },
    }),
    prisma.produkt.create({
      data: {
        namn: 'Serla Hushållspapper (säck)',
        beskrivning: 'Prisvärt hushållspapper i säck',
        pris: 249,
        foreningId: forening.id,
      },
    }),
    prisma.produkt.create({
      data: {
        namn: 'Serla Toapapper (säck)',
        beskrivning: 'Prisvärt toapapper i säck',
        pris: 229,
        foreningId: forening.id,
      },
    }),
  ])
  console.log('✅ Created', products.length, 'products')

  // Create Teams
  const lagA = await prisma.lag.create({
    data: {
      namn: 'Lag A',
      foreningId: forening.id,
    },
  })

  const lagB = await prisma.lag.create({
    data: {
      namn: 'Lag B',
      foreningId: forening.id,
    },
  })
  console.log('✅ Created teams:', lagA.namn, 'and', lagB.namn)

  // Create Order Round
  const today = new Date()
  const nextMonth = new Date(today)
  nextMonth.setMonth(today.getMonth() + 1)
  const deliveryDate = new Date(today)
  deliveryDate.setMonth(today.getMonth() + 2)

  const saljrunda = await prisma.saljrunda.create({
    data: {
      namn: 'Vårförsäljning 2026',
      forsaljningStart: today,
      forsaljningSlut: nextMonth,
      leveransDatum: deliveryDate,
      foreningId: forening.id,
    },
  })
  console.log('✅ Created order round:', saljrunda.namn)

  // Create Admin User
  const admin = await prisma.anvandare.create({
    data: {
      namn: 'Admin Användare',
      epost: 'admin@exempel.se',
      telefon: '070-1234567',
      roll: UserRole.ADMIN,
      foreningId: forening.id,
    },
  })
  console.log('✅ Created admin user:', admin.epost)

  // Create Team Members
  const teamMember1 = await prisma.anvandare.create({
    data: {
      namn: 'Emma Andersson',
      epost: 'emma@exempel.se',
      telefon: '070-1111111',
      roll: UserRole.TEAM_MEMBER,
      foreningId: forening.id,
      lagId: lagA.id,
    },
  })

  const teamMember2 = await prisma.anvandare.create({
    data: {
      namn: 'Erik Johansson',
      epost: 'erik@exempel.se',
      telefon: '070-2222222',
      roll: UserRole.TEAM_MEMBER,
      foreningId: forening.id,
      lagId: lagB.id,
    },
  })
  console.log('✅ Created team members:', teamMember1.namn, 'and', teamMember2.namn)

  // Create Streets and Addresses for Lag A
  const gataStorgatan = await prisma.gata.create({
    data: {
      namn: 'Storgatan',
      stad: 'Stockholm',
      lagId: lagA.id,
    },
  })

  const addresses1 = await Promise.all([
    prisma.adress.create({
      data: {
        gatuadress: 'Storgatan 1',
        postnummer: '11122',
        stad: 'Stockholm',
        gataId: gataStorgatan.id,
      },
    }),
    prisma.adress.create({
      data: {
        gatuadress: 'Storgatan 3',
        postnummer: '11122',
        stad: 'Stockholm',
        gataId: gataStorgatan.id,
      },
    }),
    prisma.adress.create({
      data: {
        gatuadress: 'Storgatan 5',
        postnummer: '11122',
        stad: 'Stockholm',
        gataId: gataStorgatan.id,
      },
    }),
  ])

  // Create Streets and Addresses for Lag B
  const gataKungsgatan = await prisma.gata.create({
    data: {
      namn: 'Kungsgatan',
      stad: 'Stockholm',
      lagId: lagB.id,
    },
  })

  const addresses2 = await Promise.all([
    prisma.adress.create({
      data: {
        gatuadress: 'Kungsgatan 10',
        postnummer: '11143',
        stad: 'Stockholm',
        gataId: gataKungsgatan.id,
      },
    }),
    prisma.adress.create({
      data: {
        gatuadress: 'Kungsgatan 12',
        postnummer: '11143',
        stad: 'Stockholm',
        gataId: gataKungsgatan.id,
      },
    }),
  ])

  console.log('✅ Created streets and addresses')

  // Create sample customers
  const customer1 = await prisma.kund.create({
    data: {
      namn: 'Anna Svensson',
      telefon: '070-3333333',
      epost: 'anna@exempel.se',
      prenumeration: true,
      adressId: addresses1[0].id,
    },
  })

  const customer2 = await prisma.kund.create({
    data: {
      namn: 'Lars Pettersson',
      telefon: '070-4444444',
      prenumeration: false,
      adressId: addresses1[1].id,
    },
  })

  const customer3 = await prisma.kund.create({
    data: {
      namn: 'Maria Nilsson',
      telefon: '070-5555555',
      epost: 'maria@exempel.se',
      prenumeration: false,
      adressId: addresses2[0].id,
    },
  })

  console.log('✅ Created sample customers:', customer1.namn, customer2.namn, customer3.namn)

  // Create sample orders
  const order1 = await prisma.order.create({
    data: {
      status: OrderStatus.BETALD,
      totalBelopp: 269, // 299 with 10% discount
      kundId: customer1.id,
      saljrundaId: saljrunda.id,
      saljareId: teamMember1.id,
      orderItems: {
        create: [
          {
            antal: 1,
            styckpris: 299,
            rabattTillampad: true,
            produktId: products[0].id,
          },
        ],
      },
    },
  })

  const order2 = await prisma.order.create({
    data: {
      status: OrderStatus.OBETALD,
      totalBelopp: 528, // 279 + 249
      kundId: customer2.id,
      saljrundaId: saljrunda.id,
      saljareId: teamMember1.id,
      orderItems: {
        create: [
          {
            antal: 1,
            styckpris: 279,
            rabattTillampad: false,
            produktId: products[1].id,
          },
          {
            antal: 1,
            styckpris: 249,
            rabattTillampad: false,
            produktId: products[2].id,
          },
        ],
      },
    },
  })

  console.log('✅ Created sample orders:', order1.id, order2.id)

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
