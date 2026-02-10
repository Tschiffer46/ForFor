import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import { Users } from 'lucide-react'

export default async function LagsPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const lag = await prisma.lag.findMany({
    where: { foreningId: user.foreningId },
    include: {
      teamMembers: true,
      streets: {
        include: {
          addresses: true,
        },
      },
    },
    orderBy: {
      namn: 'asc',
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lag</h1>
          <p className="text-gray-600 mt-1">Hantera lag och lagmedlemmar</p>
        </div>
        <Button>Skapa nytt lag</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lag.map((team) => {
          const totalAddresses = team.streets.reduce(
            (sum, street) => sum + street.addresses.length,
            0
          )

          return (
            <Link key={team.id} href={`/admin/lag/${team.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    {team.namn}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Medlemmar:</span>
                    <span className="font-bold">{team.teamMembers.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Gator:</span>
                    <span className="font-bold">{team.streets.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Adresser:</span>
                    <span className="font-bold">{totalAddresses}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}

        {lag.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Inga lag skapade ännu</p>
              <Button className="mt-4">Skapa ditt första lag</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
