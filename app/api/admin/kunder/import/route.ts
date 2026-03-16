import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

interface ImportCustomer {
  namn: string
  telefon?: string
  epost?: string
  gatuadress: string
  postnummer: string
  stad: string
  lagNamn?: string
  prenumeration?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.clubId) {
      return NextResponse.json({ error: 'No club assigned' }, { status: 400 })
    }

    const body = await request.json()
    const { customers } = body as { customers: ImportCustomer[] }

    if (!customers || !Array.isArray(customers)) {
      return NextResponse.json({ error: 'Ogiltig data' }, { status: 400 })
    }

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (const customerData of customers) {
      try {
        // Validate required fields
        if (!customerData.namn || !customerData.gatuadress) {
          skipped++
          errors.push(`Saknar namn eller adress for rad`)
          continue
        }

        // Find or create a lag group and team
        let lagGroup = await prisma.lagGroup.findFirst({
          where: {
            clubId: user.clubId,
          },
        })

        if (!lagGroup) {
          lagGroup = await prisma.lagGroup.create({
            data: {
              name: 'Standard',
              clubId: user.clubId,
            },
          })
        }

        let team
        if (customerData.lagNamn) {
          team = await prisma.team.findFirst({
            where: {
              name: customerData.lagNamn,
              lagGroup: { clubId: user.clubId },
            },
          })

          if (!team) {
            team = await prisma.team.create({
              data: {
                name: customerData.lagNamn,
                lagGroupId: lagGroup.id,
              },
            })
          }
        } else {
          team = await prisma.team.findFirst({
            where: { lagGroup: { clubId: user.clubId } },
          })

          if (!team) {
            team = await prisma.team.create({
              data: {
                name: 'Standard',
                lagGroupId: lagGroup.id,
              },
            })
          }
        }

        // Find or create district
        let district = await prisma.district.findFirst({
          where: {
            teamId: team.id,
          },
        })

        if (!district) {
          district = await prisma.district.create({
            data: {
              name: 'Standard',
              teamId: team.id,
            },
          })
        }

        // Find or create street
        let street = await prisma.street.findFirst({
          where: {
            name: customerData.gatuadress,
            city: customerData.stad,
            districtId: district.id,
          },
        })

        if (!street) {
          street = await prisma.street.create({
            data: {
              name: customerData.gatuadress,
              city: customerData.stad,
              districtId: district.id,
            },
          })
        }

        // Find or create address
        let address = await prisma.address.findFirst({
          where: {
            street: customerData.gatuadress,
            postalCode: customerData.postnummer,
            city: customerData.stad,
            streetId: street.id,
          },
        })

        if (!address) {
          address = await prisma.address.create({
            data: {
              street: customerData.gatuadress,
              postalCode: customerData.postnummer,
              city: customerData.stad,
              streetId: street.id,
            },
          })
        }

        // Check if customer already exists at this address
        const existingCustomer = await prisma.customer.findFirst({
          where: {
            name: customerData.namn,
            addressId: address.id,
          },
        })

        if (existingCustomer) {
          skipped++
          continue
        }

        // Create customer
        await prisma.customer.create({
          data: {
            name: customerData.namn,
            phone: customerData.telefon || null,
            email: customerData.epost || null,
            subscription: customerData.prenumeration || false,
            addressId: address.id,
          },
        })

        imported++
      } catch (error) {
        skipped++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Fel vid import av rad: ${errorMessage}`)
      }
    }

    revalidatePath('/admin/kunder')
    return NextResponse.json({
      imported,
      skipped,
      total: customers.length,
      errors: errors.slice(0, 10), // Return first 10 errors
    })
  } catch (error) {
    console.error('Error importing customers:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
