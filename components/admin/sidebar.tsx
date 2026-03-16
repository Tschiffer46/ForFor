'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Users, Package, ShoppingCart, Truck, Calendar, Building2, LogOut, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  clubName: string
  userRole: string
}

const orgAdminNav = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/klubbar', label: 'Klubbar', icon: Building2 },
  { href: '/admin/produkter', label: 'Produkter', icon: Package },
]

const clubAdminNav = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/lag', label: 'Lag & Team', icon: Users },
  { href: '/admin/kampanjer', label: 'Kampanjer', icon: Calendar },
  { href: '/admin/bestallningar', label: 'Bestallningar', icon: ShoppingCart },
  { href: '/admin/kunder', label: 'Kunder', icon: UserCircle },
  { href: '/admin/leveranslistor', label: 'Leveranslistor', icon: Truck },
]

export function AdminSidebar({ clubName, userRole }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const navItems = userRole === 'ORG_ADMIN' ? orgAdminNav : clubAdminNav

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <div className="h-full flex flex-col bg-white border-r">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-green-700">ForFor</h1>
        <p className="text-sm text-gray-500 mt-1">{clubName}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start gap-3 text-gray-600" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          Logga ut
        </Button>
      </div>
    </div>
  )
}
