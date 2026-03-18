import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ClubLoginForm } from './club-login-form'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ClubLoginPage({ params }: Props) {
  const { slug } = await params

  const club = await prisma.club.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      logoUrl: true,
      color1: true,
      color2: true,
      lagGroups: {
        include: {
          teams: {
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
  })

  if (!club) {
    notFound()
  }

  const primaryColor = club.color1 || '#15803d'

  // Flatten teams with group name for display
  const teams = club.lagGroups.flatMap((lg) =>
    lg.teams.map((t) => ({
      id: t.id,
      name: t.name,
      groupName: lg.name,
    }))
  )

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{
        background: `linear-gradient(to bottom, color-mix(in srgb, ${primaryColor} 8%, white), white)`,
      }}
    >
      <div className="w-full max-w-sm space-y-6">
        {/* Club branding */}
        <div className="text-center space-y-3">
          {club.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/uploads/${club.logoUrl}`}
              alt={club.name}
              className="h-20 w-20 mx-auto rounded-full object-cover"
            />
          ) : null}
          <h1
            className="text-2xl font-bold"
            style={{ color: primaryColor }}
          >
            {club.name}
          </h1>
          <p className="text-gray-600">Logga in för att börja sälja</p>
        </div>

        <ClubLoginForm
          clubSlug={club.slug}
          teams={teams}
          primaryColor={primaryColor}
        />

        <p className="text-center text-xs text-gray-400">
          Powered by ForFor
        </p>
      </div>
    </div>
  )
}
