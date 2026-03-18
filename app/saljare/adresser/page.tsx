import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin } from 'lucide-react'
import { AddressList } from './address-list'

export default async function AdresserPage() {
  const user = await getCurrentUser()

  if (!user || !user.teamId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">Du är inte tilldelad till något team ännu.</p>
        </CardContent>
      </Card>
    )
  }

  // Get current campaign for visit tracking
  const currentCampaign = await prisma.campaign.findFirst({
    where: {
      clubId: user.clubId!,
      salesStart: { lte: new Date() },
      salesEnd: { gte: new Date() },
    },
    select: { id: true },
  })

  // Get streets with addresses, customers, and recent visits
  const districts = await prisma.district.findMany({
    where: { teamId: user.teamId },
    include: {
      streets: {
        include: {
          addresses: {
            include: {
              customers: {
                include: {
                  orders: { select: { id: true } },
                },
              },
              visits: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { result: true, createdAt: true },
              },
            },
            orderBy: { street: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  const allStreets = districts.flatMap((d) => d.streets)
  const totalAddresses = allStreets.reduce((sum, s) => sum + s.addresses.length, 0)

  // Serialize for client component
  const streetsData = allStreets.map((street) => ({
    id: street.id,
    name: street.name,
    city: street.city,
    addresses: street.addresses.map((addr) => ({
      id: addr.id,
      street: addr.street,
      postalCode: addr.postalCode,
      city: addr.city,
      customers: addr.customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        subscription: c.subscription,
        orderCount: c.orders.length,
      })),
      lastVisit: addr.visits[0]
        ? {
            result: addr.visits[0].result,
            date: addr.visits[0].createdAt.toISOString(),
          }
        : null,
    })),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mina adresser</h1>
        <p className="text-gray-600 mt-1">
          {allStreets.length} gator, {totalAddresses} adresser
        </p>
      </div>

      {allStreets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Inga gator tilldelade till ditt team ännu.</p>
            <p className="text-sm text-gray-400 mt-2">
              Kontakta din administratör för att få gator tilldelade.
            </p>
          </CardContent>
        </Card>
      ) : (
        <AddressList streets={streetsData} campaignId={currentCampaign?.id} />
      )}
    </div>
  )
}
