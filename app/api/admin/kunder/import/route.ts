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
    
    if (!user || user.roll !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
          errors.push(`Saknar namn eller adress för rad`)
          continue
        }

        // Find or create team
        let team
        if (customerData.lagNamn) {
          team = await prisma.lag.findFirst({
            where: {
              namn: customerData.lagNamn,
              foreningId: user.foreningId,
            },
          })
          
          if (!team) {
            // Create the team if it doesn't exist
            team = await prisma.lag.create({
              data: {
                namn: customerData.lagNamn,
                foreningId: user.foreningId,
              },
            })
          }
        } else {
          // Use the first team or create a default one
          team = await prisma.lag.findFirst({
            where: { foreningId: user.foreningId },
          })
          
          if (!team) {
            team = await prisma.lag.create({
              data: {
                namn: 'Standard',
                foreningId: user.foreningId,
              },
            })
          }
        }

        // Find or create street (gata)
        let street = await prisma.gata.findFirst({
          where: {
            namn: customerData.gatuadress,
            stad: customerData.stad,
            lagId: team.id,
          },
        })

        if (!street) {
          street = await prisma.gata.create({
            data: {
              namn: customerData.gatuadress,
              stad: customerData.stad,
              lagId: team.id,
            },
          })
        }

        // Find or create address
        let address = await prisma.adress.findFirst({
          where: {
            gatuadress: customerData.gatuadress,
            postnummer: customerData.postnummer,
            stad: customerData.stad,
            gataId: street.id,
          },
        })

        if (!address) {
          address = await prisma.adress.create({
            data: {
              gatuadress: customerData.gatuadress,
              postnummer: customerData.postnummer,
              stad: customerData.stad,
              gataId: street.id,
            },
          })
        }

        // Check if customer already exists at this address
        const existingCustomer = await prisma.kund.findFirst({
          where: {
            namn: customerData.namn,
            adressId: address.id,
          },
        })

        if (existingCustomer) {
          skipped++
          continue
        }

        // Create customer
        await prisma.kund.create({
          data: {
            namn: customerData.namn,
            telefon: customerData.telefon || null,
            epost: customerData.epost || null,
            prenumeration: customerData.prenumeration || false,
            adressId: address.id,
          },
        })

        imported++
      } catch (error) {
        skipped++
        errors.push(`Fel vid import av ${customerData.namn}: ${error}`)
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
