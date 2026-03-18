import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { MapPin, Globe, Mail, Phone, User } from 'lucide-react'
import { ClubLogo } from '@/components/admin/club-logo'
import { ClubColors } from '@/components/admin/club-colors'
import { ClubKeyPersons } from '@/components/admin/club-key-persons'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ClubDetailPage({ params }: Props) {
  const { slug } = await params
  const user = await getCurrentUser()
  if (!user || user.role !== 'ORG_ADMIN') return null

  const club = await prisma.club.findUnique({
    where: { slug },
    include: {
      lagGroups: {
        include: {
          teams: {
            include: {
              _count: { select: { orders: true, districts: true } },
            },
          },
        },
      },
      campaigns: {
        orderBy: { salesStart: 'desc' },
        take: 5,
      },
      keyPersons: {
        orderBy: { role: 'asc' },
      },
      _count: {
        select: { users: true },
      },
    },
  })

  if (!club) return notFound()

  const totalOrders = await prisma.order.count({
    where: { team: { lagGroup: { clubId: club.id } } },
  })
  const totalRevenue = await prisma.order.aggregate({
    where: { team: { lagGroup: { clubId: club.id } }, status: 'BETALD' },
    _sum: { totalAmount: true },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo (#7) */}
          <ClubLogo slug={club.slug} logoUrl={club.logoUrl} />
          <div>
            <h1 className="text-3xl font-bold">{club.name}</h1>
            {club.sport && <p className="text-gray-600 mt-1">{club.sport}</p>}
          </div>
        </div>
        <Badge variant={club.active ? 'success' : 'secondary'} className="text-base px-4 py-1">
          {club.active ? 'Aktiv' : 'Inaktiv'}
        </Badge>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Beställningar</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalOrders}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Intäkt</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalRevenue._sum.totalAmount || 0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Laggrupper</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{club.lagGroups.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Användare</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{club._count.users}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Klubbinfo</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {(club.address || club.city) && (
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" />{[club.address, club.postalCode, club.city].filter(Boolean).join(', ')}</p>
            )}
            {club.contactEmail && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" />{club.contactEmail}</p>}
            {club.contactPhone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" />{club.contactPhone}</p>}
            {club.contactName && <p className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" />{club.contactName}</p>}
            {club.website && <p className="flex items-center gap-2"><Globe className="h-4 w-4 text-gray-400" />{club.website}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Laggrupper & Team</CardTitle></CardHeader>
          <CardContent>
            {club.lagGroups.length === 0 ? (
              <p className="text-gray-500 text-sm">Inga laggrupper</p>
            ) : (
              <div className="space-y-4">
                {club.lagGroups.map((lg) => (
                  <div key={lg.id}>
                    <p className="font-medium text-sm">{lg.name}</p>
                    <div className="mt-1 space-y-1">
                      {lg.teams.map((team) => (
                        <div key={team.id} className="flex justify-between text-xs text-gray-600 pl-4">
                          <span>{team.name}</span>
                          <span>{team._count.orders} orders, {team._count.districts} distrikt</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Persons (#8) */}
      <Card>
        <CardHeader><CardTitle>Nyckelpersoner</CardTitle></CardHeader>
        <CardContent>
          <ClubKeyPersons slug={club.slug} keyPersons={club.keyPersons} />
        </CardContent>
      </Card>

      {/* Club Colors (#11) */}
      <Card>
        <CardHeader><CardTitle>Klubbfärger</CardTitle></CardHeader>
        <CardContent>
          <ClubColors slug={club.slug} color1={club.color1} color2={club.color2} color3={club.color3} color4={club.color4} />
        </CardContent>
      </Card>
    </div>
  )
}
