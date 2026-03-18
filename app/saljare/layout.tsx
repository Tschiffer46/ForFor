import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SeljarBottomNav } from '@/components/saljare/bottom-nav'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

const DEFAULT_PRIMARY = '#15803d'
const DEFAULT_SECONDARY = '#166534'

export default async function SeljarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'TEAM_MEMBER') {
    redirect('/logga-in/saljare')
  }

  const club = user.clubId
    ? await prisma.club.findUnique({
        where: { id: user.clubId },
        select: { name: true, logoUrl: true, color1: true, color2: true },
      })
    : null

  const primaryColor = club?.color1 || DEFAULT_PRIMARY
  const secondaryColor = club?.color2 || DEFAULT_SECONDARY

  const handleLogout = async () => {
    'use server'
    const { clearSession } = await import('@/lib/auth')
    await clearSession()
    redirect('/')
  }

  return (
    <div
      className="min-h-screen bg-gray-50 pb-24"
      style={{
        '--club-primary': primaryColor,
        '--club-secondary': secondaryColor,
      } as React.CSSProperties}
    >
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {club?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/uploads/${club.logoUrl}`}
                alt={club.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : null}
            <div>
              <h1
                className="text-lg font-bold"
                style={{ color: primaryColor }}
              >
                {club?.name || 'ForFor'}
              </h1>
              <p className="text-sm text-gray-600">{user.name}</p>
            </div>
          </div>
          <form action={handleLogout}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {children}
      </main>

      {/* Bottom navigation */}
      <SeljarBottomNav />
    </div>
  )
}
