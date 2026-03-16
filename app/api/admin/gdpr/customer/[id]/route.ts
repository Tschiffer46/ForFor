import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ORG_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify the customer exists and optionally belongs to user's org
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        ...(user.organizationId
          ? {
              address: {
                streetRef: {
                  district: {
                    team: {
                      lagGroup: {
                        club: {
                          organizationId: user.organizationId,
                        },
                      },
                    },
                  },
                },
              },
            }
          : {}),
      },
      include: {
        orders: true,
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Kund hittades inte' },
        { status: 404 }
      )
    }

    // Anonymize the customer: replace personal data but keep order totals
    await prisma.customer.update({
      where: { id },
      data: {
        name: 'Raderad',
        phone: null,
        email: null,
        subscription: false,
      },
    })

    // Clear address details for the customer's address (if no other customers use it)
    const otherCustomersAtAddress = await prisma.customer.count({
      where: {
        addressId: customer.addressId,
        id: { not: id },
      },
    })

    if (otherCustomersAtAddress === 0) {
      await prisma.address.update({
        where: { id: customer.addressId },
        data: {
          street: 'Raderad',
          postalCode: '00000',
          city: 'Raderad',
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Kunddata har anonymiserats. Beställningsbelopp behålls för bokföring.',
      ordersPreserved: customer.orders.length,
    })
  } catch (error) {
    console.error('GDPR anonymization error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
