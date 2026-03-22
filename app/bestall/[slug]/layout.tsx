import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export default async function BestallLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const club = await prisma.club.findUnique({
    where: { slug },
    select: { name: true, logoUrl: true, color1: true },
  })

  if (!club) notFound()

  const primaryColor = club.color1 || '#15803d'

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ '--club-primary': primaryColor } as React.CSSProperties}
    >
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {club.logoUrl && (
            <img
              src={`/api/uploads/${club.logoUrl}`}
              alt={club.name}
              className="h-10 w-10 object-contain"
            />
          )}
          <h1 className="text-lg font-bold">{club.name}</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
      <footer className="text-center py-6 text-xs text-gray-400">
        Powered by ForFor
      </footer>
    </div>
  )
}
