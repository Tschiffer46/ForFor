'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, MapPin, ShoppingCart, List } from 'lucide-react'

const navItems = [
  {
    title: 'Hem',
    href: '/saljare',
    icon: Home,
  },
  {
    title: 'Adresser',
    href: '/saljare/adresser',
    icon: MapPin,
  },
  {
    title: 'Ny Order',
    href: '/saljare/ny-bestallning',
    icon: ShoppingCart,
  },
  {
    title: 'Mina Orders',
    href: '/saljare/bestallningar',
    icon: List,
  },
]

export function SeljarBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="grid grid-cols-4 h-20">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                isActive
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className="h-7 w-7" />
              <span className="text-xs font-medium">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
