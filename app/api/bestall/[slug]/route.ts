import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateCustomerNumber } from '@/lib/customer-number'
import { calculateOrderItems, generateOrderSwishQR } from '@/lib/order'
import { sendOrderConfirmation } from '@/lib/email'
import { revalidatePath } from 'next/cache'

interface OrderBody {
  customerId?: string
  customerNumber?: string
  customerEmail?: string
  customerPhone?: string
  newCustomer?: {
    name: string
    street: string
    postalCode: string
    city: string
    phone?: string
    email?: string
  }
  items: { productId: string; quantity: number }[]
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = (await request.json()) as OrderBody

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Inga produkter valda' },
        { status: 400 }
      )
    }

    if (!body.customerId && !body.customerNumber && !body.newCustomer) {
      return NextResponse.json(
        { error: 'Kundnummer eller ny kund krävs' },
        { status: 400 }
      )
    }

    // 1. Find club by slug
    const club = await prisma.club.findUnique({
      where: { slug },
    })

    if (!club) {
      return NextResponse.json(
        { error: 'Klubb hittades inte' },
        { status: 404 }
      )
    }

    // 2. Verify active campaign exists
    const now = new Date()
    const campaign = await prisma.campaign.findFirst({
      where: {
        clubId: club.id,
        status: 'ACTIVE',
        salesStart: { lte: now },
        salesEnd: { gte: now },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Ingen aktiv kampanj just nu' },
        { status: 400 }
      )
    }

    let customerId: string
    let customerSubscription = false
    let customerEmail: string | null = null
    let teamId: string

    if (body.customerId) {
      // 3a. Direct customer ID from search
      const customer = await prisma.customer.findFirst({
        where: {
          id: body.customerId,
          address: {
            streetRef: {
              district: { team: { lagGroup: { clubId: club.id } } },
            },
          },
        },
        include: {
          address: {
            include: { streetRef: { include: { district: true } } },
          },
        },
      })
      if (!customer) {
        return NextResponse.json({ error: 'Kund hittades inte' }, { status: 404 })
      }
      customerId = customer.id
      customerSubscription = customer.subscription
      teamId = customer.address.streetRef.district.teamId

      // Update contact info if provided
      const updates: Record<string, string> = {}
      if (body.customerEmail) updates.email = body.customerEmail
      if (body.customerPhone) updates.phone = body.customerPhone
      if (Object.keys(updates).length > 0) {
        await prisma.customer.update({ where: { id: customerId }, data: updates })
      }
      customerEmail = body.customerEmail || customer.email
    } else if (body.customerNumber) {
      // 3a. Lookup existing customer
      const customer = await prisma.customer.findUnique({
        where: { customerNumber: body.customerNumber },
        include: {
          address: {
            include: {
              streetRef: {
                include: {
                  district: {
                    include: {
                      team: {
                        include: { lagGroup: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (!customer) {
        return NextResponse.json(
          { error: 'Kund hittades inte' },
          { status: 404 }
        )
      }

      // Verify customer belongs to this club
      if (
        customer.address.streetRef.district.team.lagGroup.clubId !== club.id
      ) {
        return NextResponse.json(
          { error: 'Kund tillhör inte denna klubb' },
          { status: 400 }
        )
      }

      customerId = customer.id
      customerSubscription = customer.subscription
      teamId = customer.address.streetRef.district.team.id

      // Update contact info if provided
      const updates: Record<string, string> = {}
      if (body.customerEmail) updates.email = body.customerEmail
      if (body.customerPhone) updates.phone = body.customerPhone
      if (Object.keys(updates).length > 0) {
        await prisma.customer.update({ where: { id: customerId }, data: updates })
      }
      customerEmail = body.customerEmail || customer.email
    } else {
      // 3b. Create new customer
      const nc = body.newCustomer!

      if (!nc.name || !nc.street || !nc.postalCode || !nc.city) {
        return NextResponse.json(
          { error: 'Namn, gatuadress, postnummer och ort krävs' },
          { status: 400 }
        )
      }

      // Check for duplicate (same name + street in same club)
      const duplicate = await prisma.customer.findFirst({
        where: {
          name: { equals: nc.name, mode: 'insensitive' },
          address: {
            street: { equals: nc.street, mode: 'insensitive' },
            streetRef: {
              district: {
                team: {
                  lagGroup: { clubId: club.id },
                },
              },
            },
          },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'En kund med samma namn och adress finns redan' },
          { status: 409 }
        )
      }

      // Find a team to assign to — use the first team's first district's first street
      let street = await prisma.street.findFirst({
        where: {
          district: {
            team: {
              lagGroup: { clubId: club.id },
            },
          },
        },
        include: {
          district: {
            include: { team: true },
          },
        },
      })

      if (!street) {
        // Create a "Standard" lag group + team + district + street
        const lagGroup = await prisma.lagGroup.create({
          data: {
            name: 'Standard',
            clubId: club.id,
          },
        })

        const team = await prisma.team.create({
          data: {
            name: 'Standard',
            lagGroupId: lagGroup.id,
          },
        })

        const district = await prisma.district.create({
          data: {
            name: 'Standard',
            teamId: team.id,
          },
        })

        street = await prisma.street.create({
          data: {
            name: nc.street,
            city: nc.city,
            districtId: district.id,
          },
          include: {
            district: {
              include: { team: true },
            },
          },
        })
      }

      teamId = street.district.team.id

      // Create address
      const address = await prisma.address.create({
        data: {
          street: nc.street,
          postalCode: nc.postalCode,
          city: nc.city,
          streetId: street.id,
        },
      })

      // Generate customer number and create customer
      const customerNumber = await generateCustomerNumber(club.id)

      const customer = await prisma.customer.create({
        data: {
          name: nc.name,
          customerNumber,
          phone: nc.phone || null,
          email: nc.email || null,
          addressId: address.id,
        },
      })

      customerId = customer.id
      customerSubscription = false
      customerEmail = nc.email || null
    }

    // 4. Calculate order total and generate Swish QR
    const { totalAmount, orderItemsData } = await calculateOrderItems(
      body.items,
      customerSubscription
    )
    const swishQrCode = await generateOrderSwishQR(totalAmount, club.id)

    // 7. Create order
    const order = await prisma.order.create({
      data: {
        customerId,
        campaignId: campaign.id,
        teamId,
        totalAmount,
        swishQrCode,
        source: 'WEB',
        status: 'OBETALD',
        items: { create: orderItemsData },
        deliveries: { create: { status: 'EJ_HAMTAD' } },
      },
      include: {
        customer: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    })

    revalidatePath('/admin/bestallningar')
    revalidatePath('/admin/kunder')

    const orderItems = order.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }))

    // 8. Send confirmation email (async, don't block response)
    if (customerEmail) {
      sendOrderConfirmation({
        to: customerEmail,
        customerName: order.customer.name,
        clubName: club.name,
        items: orderItems,
        totalAmount: order.totalAmount,
        deliveryStart: campaign.deliveryStart?.toISOString(),
        deliveryEnd: campaign.deliveryEnd?.toISOString(),
      }).catch((err) => console.error('Error sending order email:', err))
    }

    // 9. Return response
    return NextResponse.json({
      orderId: order.id,
      totalAmount: order.totalAmount,
      swishQrCode: order.swishQrCode,
      customerName: order.customer.name,
      items: orderItems,
    })
  } catch (error) {
    console.error('Error creating web order:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
