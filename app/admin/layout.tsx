import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminSidebar } from '@/components/admin/sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
    redirect('/logga-in/admin')
  }

  let displayName = 'ForFor'
  let logoUrl: string | null = null
  let clubColors: { color1: string | null; color2: string | null; color3: string | null; color4: string | null } | null = null

  if (user.role === 'ORG_ADMIN' && user.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { name: true },
    })
    displayName = org?.name || 'ForFor'
  } else if (user.clubId) {
    const club = await prisma.club.findUnique({
      where: { id: user.clubId },
      select: { name: true, logoUrl: true, color1: true, color2: true, color3: true, color4: true },
    })
    displayName = club?.name || 'ForFor'
    logoUrl = club?.logoUrl || null
    clubColors = club ? { color1: club.color1, color2: club.color2, color3: club.color3, color4: club.color4 } : null
  }

  // Build CSS custom properties from club colors
  const colorStyle: Record<string, string> = {}
  if (clubColors?.color1) {
    colorStyle['--club-primary'] = clubColors.color1
  }
  if (clubColors?.color2) {
    colorStyle['--club-secondary'] = clubColors.color2
  }

  return (
    <div className="h-screen flex overflow-hidden" style={colorStyle}>
      <aside className="w-64 flex-shrink-0">
        <AdminSidebar clubName={displayName} userRole={user.role} logoUrl={logoUrl} clubColors={clubColors} />
      </aside>
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="container mx-auto p-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}
