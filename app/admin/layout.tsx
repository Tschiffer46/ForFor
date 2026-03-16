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
  if (user.role === 'ORG_ADMIN' && user.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { name: true },
    })
    displayName = org?.name || 'ForFor'
  } else if (user.clubId) {
    const club = await prisma.club.findUnique({
      where: { id: user.clubId },
      select: { name: true },
    })
    displayName = club?.name || 'ForFor'
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <aside className="w-64 flex-shrink-0">
        <AdminSidebar clubName={displayName} userRole={user.role} />
      </aside>
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="container mx-auto p-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}
