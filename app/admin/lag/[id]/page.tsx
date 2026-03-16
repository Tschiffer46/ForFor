import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, MapPin } from 'lucide-react'
import type { User as UserType, Street as StreetType, Address as AddressType } from '@prisma/client'

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      users: true,
      districts: {
        include: {
          streets: {
            include: {
              addresses: true,
            },
            orderBy: {
              name: 'asc',
            },
          },
        },
      },
      lagGroup: {
        include: {
          club: true,
        },
      },
    },
  })

  if (!team) {
    notFound()
  }

  const allStreets = team.districts.flatMap((d) => d.streets)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/lag">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="text-gray-600 mt-1">{team.lagGroup.club.name}</p>
        </div>
        <Button>Redigera lag</Button>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Lagmedlemmar ({team.users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {team.users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Inga medlemmar i laget annu</p>
              <Button className="mt-4" variant="outline">
                Lagg till medlem
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {team.users.map((member: UserType) => (
                <div
                  key={member.id}
                  className="py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    {member.phone && (
                      <p className="text-sm text-gray-600">{member.phone}</p>
                    )}
                  </div>
                  <Badge>{member.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Streets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Tilldelade gator ({allStreets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allStreets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Inga gator tilldelade annu</p>
              <Button className="mt-4" variant="outline">
                Tilldela gata
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {allStreets.map((street: StreetType & { addresses: AddressType[] }) => (
                <div
                  key={street.id}
                  className="p-4 border rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold">{street.name}</h3>
                      <p className="text-sm text-gray-600">{street.city}</p>
                    </div>
                    <Badge variant="outline">
                      {street.addresses.length} adresser
                    </Badge>
                  </div>

                  {street.addresses.length > 0 && (
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      {street.addresses.slice(0, 3).map((address: AddressType) => (
                        <p key={address.id}>
                          {address.street}, {address.postalCode}
                        </p>
                      ))}
                      {street.addresses.length > 3 && (
                        <p className="text-gray-400 italic">
                          +{street.addresses.length - 3} fler adresser...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
