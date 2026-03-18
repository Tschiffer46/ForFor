'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Users, Package, ShoppingCart, Truck, Calendar, Building2, LogOut, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ClubColors {
  color1: string | null
  color2: string | null
  color3: string | null
  color4: string | null
}

interface SidebarProps {
  clubName: string
  userRole: string
  logoUrl?: string | null
  clubColors?: ClubColors | null
}

const orgAdminNav = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/bestallningar', label: 'Beställningar', icon: ShoppingCart },
  { href: '/admin/klubbar', label: 'Klubbar', icon: Building2 },
  { href: '/admin/produkter', label: 'Produkter', icon: Package },
  { href: '/admin/leverantorer', label: 'Leverantörer', icon: Truck },
]

const clubAdminNav = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/lag', label: 'Lag & Team', icon: Users },
  { href: '/admin/kampanjer', label: 'Kampanjer', icon: Calendar },
  { href: '/admin/bestallningar', label: 'Bestallningar', icon: ShoppingCart },
  { href: '/admin/kunder', label: 'Kunder', icon: UserCircle },
  { href: '/admin/leveranslistor', label: 'Leveranslistor', icon: Truck },
]

export function AdminSidebar({ clubName, userRole, logoUrl, clubColors }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const navItems = userRole === 'ORG_ADMIN' ? orgAdminNav : clubAdminNav

  const primaryColor = clubColors?.color1 || '#15803d' // green-700 default
  const primaryBg = clubColors?.color1 ? `${clubColors.color1}15` : undefined // 15 = ~8% opacity

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <div className="h-full flex flex-col bg-white border-r">
      <div className="p-6 border-b">
        {logoUrl ? (
          <div className="flex items-center gap-3">
            <img src={logoUrl.startsWith('/') ? `/api/uploads${logoUrl}` : logoUrl} alt={clubName} className="h-10 w-10 object-contain rounded" />
            <div>
              <h1 className="text-lg font-bold" style={{ color: primaryColor }}>{clubName}</h1>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold" style={{ color: primaryColor }}>ForFor</h1>
            <p className="text-sm text-gray-500 mt-1">{clubName}</p>
          </>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? ''
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={isActive ? { backgroundColor: primaryBg || '#f0fdf4', color: primaryColor } : undefined}
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
