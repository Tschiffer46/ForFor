import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { SeljarBottomNav } from '@/components/säljare/bottom-nav'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default async function SeljarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user || user.roll !== 'TEAM_MEMBER') {
    redirect('/logga-in/säljare')
  }

  const handleLogout = async () => {
    'use server'
    const { clearSession } = await import('@/lib/auth')
    await clearSession()
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-green-700">ForFor</h1>
            <p className="text-sm text-gray-600">{user.namn}</p>
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
