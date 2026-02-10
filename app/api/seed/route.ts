import { NextResponse } from 'next/server'
import { PrismaClient, UserRole, OrderStatus } from '@prisma/client'

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

    // Create Förening (Club)
    const forening = await prisma.forening.create({
      data: {
        name: 'Exempel Sportklubb',
      },
    })

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

    // Create sample orders
    await prisma.order.create({
      data: {
        status: OrderStatus.BETALD,
        totalBelopp: 269,
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

    await prisma.order.create({
      data: {
        status: OrderStatus.OBETALD,
        totalBelopp: 528,
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

    return NextResponse.json({
      success: true,
      message: '🎉 Databas populerad med testdata!',
      data: {
        club: forening.name,
        products: products.length,
        teams: [lagA.namn, lagB.namn],
        admin: admin.epost,
        teamMembers: [teamMember1.epost, teamMember2.epost],
        streets: ['Storgatan', 'Kungsgatan'],
        customers: [customer1.namn, customer2.namn, customer3.namn],
        orderRound: saljrunda.namn,
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