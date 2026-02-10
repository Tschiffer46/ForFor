'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Calendar, 
  ShoppingCart, 
  UserCircle,
  FileText,
  LogOut
} from 'lucide-react'

interface SidebarProps {
  clubName: string
}

const navItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Lag',
    href: '/admin/lag',
    icon: Users,
  },
  {
    title: 'Produkter',
    href: '/admin/produkter',
    icon: Package,
  },
  {
    title: 'Säljrundor',
    href: '/admin/saljrundor',
    icon: Calendar,
  },
  {
    title: 'Beställningar',
    href: '/admin/bestallningar',
    icon: ShoppingCart,
  },
  {
    title: 'Kunder',
    href: '/admin/kunder',
    icon: UserCircle,
  },
  {
    title: 'Leveranslistor',
    href: '/admin/leveranslistor',
    icon: FileText,
  },
]

export function AdminSidebar({ clubName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <div className="flex h-full flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">{clubName}</h1>
        <p className="text-sm text-gray-400">Administratörspanel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.title}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logga ut
        </Button>
      </div>
    </div>
  )
}
