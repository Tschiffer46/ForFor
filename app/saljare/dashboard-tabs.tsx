'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, TrendingUp, Package, MapPin, ShoppingCart, Eye } from 'lucide-react'
import Link from 'next/link'

interface Props {
  userName: string
  campaign: {
    name: string
    salesEnd: string
    deliveryStart: string | null
    daysRemaining: number
  } | null
  stats: {
    totalOrders: number
    paidOrders: number
    totalRevenue: string
  }
  streetProgress: {
    id: string
    name: string
    total: number
    visited: number
    bought: number
  }[]
}

export function DashboardTabs({ userName, campaign, stats, streetProgress }: Props) {
  const [tab, setTab] = useState<'today' | 'stats'>('today')
  const [showExplainer, setShowExplainer] = useState(false)

  // Show first-time explainer
  useEffect(() => {
    const seen = localStorage.getItem('forfor-explainer-seen')
    if (!seen) {
      setShowExplainer(true)
    }
  }, [])

  function dismissExplainer() {
    localStorage.setItem('forfor-explainer-seen', '1')
    setShowExplainer(false)
  }

  return (
    <div className="space-y-4">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Hej, {userName}!</h1>
        {campaign && (
          <p className="text-sm text-gray-600 mt-1">
            {campaign.name} — {campaign.daysRemaining} dagar kvar
          </p>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('today')}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={
            tab === 'today'
              ? {
                  backgroundColor: 'var(--club-primary, #15803d)',
                  color: 'white',
                }
              : {
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                }
          }
        >
          Idag
        </button>
        <button
          onClick={() => setTab('stats')}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={
            tab === 'stats'
              ? {
                  backgroundColor: 'var(--club-primary, #15803d)',
                  color: 'white',
                }
              : {
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                }
          }
        >
          Statistik
        </button>
      </div>

      {/* ─── TODAY TAB ─── */}
      {tab === 'today' && (
        <div className="space-y-4">
          {/* First-time explainer */}
          {showExplainer && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <p className="font-bold text-sm text-blue-900 mb-2">Så här funkar det:</p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Gå till en adress</li>
                  <li>Visa produkterna</li>
                  <li>Ta en beställning</li>
                  <li>Kunden betalar med Swish</li>
                </ol>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 text-blue-700 border-blue-300"
                  onClick={dismissExplainer}
                >
                  Ok, jag förstår!
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/saljare/ny-bestallning">
              <Button
                className="w-full h-16 text-base"
                style={{ backgroundColor: 'var(--club-primary, #15803d)' }}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Ny order
              </Button>
            </Link>
            <Link href="/saljare/produkter">
              <Button variant="outline" className="w-full h-16 text-base">
                <Eye className="mr-2 h-5 w-5" />
                Produkter
              </Button>
            </Link>
          </div>

          {/* Street progress */}
          {streetProgress.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" style={{ color: 'var(--club-primary, #15803d)' }} />
                  Mina gator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {streetProgress.map((street) => {
                  const progress = street.total > 0 ? (street.visited / street.total) * 100 : 0
                  return (
                    <div key={street.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{street.name}</span>
                        <span className="text-xs text-gray-500">
                          {street.visited}/{street.total} besökta
                          {street.bought > 0 && (
                            <span style={{ color: 'var(--club-primary, #15803d)' }}>
                              {' '}({street.bought} köp)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: 'var(--club-primary, #15803d)',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}

                <Link href="/saljare/adresser">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Visa alla adresser
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── STATS TAB ─── */}
      {tab === 'stats' && (
        <div className="space-y-4">
          {/* Campaign info */}
          {campaign && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" style={{ color: 'var(--club-primary, #15803d)' }} />
                  Kampanj
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold">{campaign.name}</p>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Försäljning till:</span>
                    <span className="font-medium">{campaign.salesEnd}</span>
                  </div>
                  {campaign.deliveryStart && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Leveransdatum:</span>
                      <span className="font-medium">{campaign.deliveryStart}</span>
                    </div>
                  )}
                </div>
                <Badge variant="success" className="w-full justify-center py-1.5 mt-3">
                  {campaign.daysRemaining} dagar kvar
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-sm text-gray-600">Totalt orders</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalOrders}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Package className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--club-primary, #15803d)' }} />
                  <p className="text-sm text-gray-600">Betalda</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: 'var(--club-primary, #15803d)' }}>
                    {stats.paidOrders}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total försäljning</p>
                <p className="text-4xl font-bold mt-2" style={{ color: 'var(--club-secondary, #166534)' }}>
                  {stats.totalRevenue}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
