import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { reserveCustomerNumbers } from '@/lib/customer-number'

interface ImportCustomer {
  namn: string
  telefon?: string
  epost?: string
  gatuadress: string
  postnummer: string
  stad: string
  lag?: string
  lagNamn?: string
}

interface RejectedRow {
  row: number
  data: ImportCustomer
  reason: string
}

interface WarningRow {
  row: number
  data: ImportCustomer
  warnings: string[]
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
    let numberIndex = 0
    const rejectedRows: RejectedRow[] = []
    const warningRows: WarningRow[] = []

    // Reserve a batch of customer numbers upfront (max possible = total rows)
    const { prefix, startNumber } = await reserveCustomerNumbers(
      user.clubId,
      customers.length
    )

    for (let i = 0; i < customers.length; i++) {
      const customerData = customers[i]
      const rowNumber = i + 1

      try {
        // Validate required fields
        const missingFields: string[] = []
        if (!customerData.namn?.trim()) missingFields.push('namn')
        if (!customerData.gatuadress?.trim()) missingFields.push('gatuadress')

        if (missingFields.length > 0) {
          rejectedRows.push({
            row: rowNumber,
            data: customerData,
            reason: `Saknar ${missingFields.join(' och ')}`,
          })
          continue
        }

        // Track warnings for optional fields
        const warnings: string[] = []
        if (!customerData.postnummer?.trim()) warnings.push('Saknar postnummer')
        if (!customerData.stad?.trim()) warnings.push('Saknar stad')

        // Find or create lag group
        const lagGroupName = customerData.lag?.trim() || 'Standard'
        let lagGroup = await prisma.lagGroup.findFirst({
          where: {
            name: lagGroupName,
            clubId: user.clubId,
          },
        })

        if (!lagGroup) {
          lagGroup = await prisma.lagGroup.create({
            data: {
              name: lagGroupName,
              clubId: user.clubId,
            },
          })
        }

        // Find or create team
        const teamName = customerData.lagNamn?.trim() || 'Standard'
        let team = await prisma.team.findFirst({
          where: {
            name: teamName,
            lagGroupId: lagGroup.id,
          },
        })

        if (!team) {
          team = await prisma.team.create({
            data: {
              name: teamName,
              lagGroupId: lagGroup.id,
            },
          })
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
        const streetName = customerData.gatuadress.trim()
        const cityName = customerData.stad?.trim() || ''
        let street = await prisma.street.findFirst({
          where: {
            name: streetName,
            city: cityName,
            districtId: district.id,
          },
        })

        if (!street) {
          street = await prisma.street.create({
            data: {
              name: streetName,
              city: cityName,
              districtId: district.id,
            },
          })
        }

        // Find or create address
        const postalCode = customerData.postnummer?.trim() || ''
        let address = await prisma.address.findFirst({
          where: {
            street: streetName,
            postalCode: postalCode,
            city: cityName,
            streetId: street.id,
          },
        })

        if (!address) {
          address = await prisma.address.create({
            data: {
              street: streetName,
              postalCode: postalCode,
              city: cityName,
              streetId: street.id,
            },
          })
        }

        // Check if customer already exists at this address
        const existingCustomer = await prisma.customer.findFirst({
          where: {
            name: customerData.namn.trim(),
            addressId: address.id,
          },
        })

        if (existingCustomer) {
          rejectedRows.push({
            row: rowNumber,
            data: customerData,
            reason: 'Duplicerad kund (samma namn och adress finns redan)',
          })
          continue
        }

        // Create customer with club-prefixed number
        const customerNumber = `${prefix}-${startNumber + numberIndex}`
        numberIndex++

        await prisma.customer.create({
          data: {
            name: customerData.namn.trim(),
            phone: customerData.telefon?.trim() || null,
            email: customerData.epost?.trim() || null,
            subscription: false,
            customerNumber,
            addressId: address.id,
          },
        })

        imported++

        if (warnings.length > 0) {
          warningRows.push({
            row: rowNumber,
            data: customerData,
            warnings,
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Okänt fel'
        rejectedRows.push({
          row: rowNumber,
          data: customerData,
          reason: `Tekniskt fel: ${errorMessage}`,
        })
      }
    }

    // Adjust the club counter back if we reserved more numbers than we used
    const unused = customers.length - numberIndex
    if (unused > 0) {
      await prisma.club.update({
        where: { id: user.clubId },
        data: { nextCustomerNumber: { decrement: unused } },
      })
    }

    revalidatePath('/admin/kunder')
    return NextResponse.json({
      imported,
      skipped: rejectedRows.length,
      warnings: warningRows.length,
      total: customers.length,
      rejectedRows,
      warningRows,
    })
  } catch (error) {
    console.error('Error importing customers:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
