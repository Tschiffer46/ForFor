'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Home, ClipboardCheck } from 'lucide-react'
import { MarkVisitDialog } from '@/components/saljare/mark-visit-dialog'

interface Street {
  id: string
  name: string
  city: string
  addresses: Address[]
}

interface Address {
  id: string
  street: string
  postalCode: string
  city: string
  customers: {
    id: string
    name: string
    phone: string | null
    subscription: boolean
    orderCount: number
  }[]
  lastVisit: {
    result: string
    date: string
  } | null
}

const visitResultLabels: Record<string, { label: string; color: string }> = {
  KOPT: { label: 'Köpte', color: '#16a34a' },
  NEJ_TACK: { label: 'Nej tack', color: '#6b7280' },
  NEJ_TACK_FRAMTIDEN: { label: 'Kanske senare', color: '#ca8a04' },
  INGEN_HEMMA: { label: 'Ingen hemma', color: '#ea580c' },
  EJ_BESIKT: { label: 'Ej besökt', color: '#9ca3af' },
}

export function AddressList({
  streets,
  campaignId,
}: {
  streets: Street[]
  campaignId?: string
}) {
  return (
    <div className="space-y-4">
      {streets.map((street) => (
        <Card key={street.id}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" style={{ color: 'var(--club-primary, #15803d)' }} />
              {street.name}
              <Badge variant="outline" className="ml-auto">
                {street.addresses.length} adresser
              </Badge>
            </CardTitle>
            <p className="text-sm text-gray-500">{street.city}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {street.addresses.map((address) => (
              <div
                key={address.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Home className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{address.street}</p>
                      <p className="text-sm text-gray-600">
                        {address.postalCode} {address.city}
                      </p>

                      {/* Visit status */}
                      {address.lastVisit && (
                        <div className="mt-1">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full inline-block"
                            style={{
                              color: visitResultLabels[address.lastVisit.result]?.color || '#6b7280',
                              backgroundColor: `color-mix(in srgb, ${visitResultLabels[address.lastVisit.result]?.color || '#6b7280'} 15%, white)`,
                            }}
                          >
                            {visitResultLabels[address.lastVisit.result]?.label || address.lastVisit.result}
                          </span>
                        </div>
                      )}

                      {/* Customers */}
                      {address.customers.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {address.customers.map((customer) => (
                            <div
                              key={customer.id}
                              className="text-sm bg-blue-50 px-2 py-1 rounded"
                            >
                              <p className="font-medium text-blue-900">{customer.name}</p>
                              {customer.phone && (
                                <p className="text-blue-700">{customer.phone}</p>
                              )}
                              {customer.subscription && (
                                <Badge variant="success" className="text-xs mt-1">
                                  Prenumeration (10% rabatt)
                                </Badge>
                              )}
                              {customer.orderCount > 0 && (
                                <p className="text-xs text-blue-600 mt-1">
                                  {customer.orderCount} tidigare order(s)
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mark visit button */}
                  <MarkVisitDialog
                    addressId={address.id}
                    addressLabel={address.street}
                    campaignId={campaignId}
                    trigger={
                      <Button variant="outline" size="sm" className="flex-shrink-0 ml-2">
                        <ClipboardCheck className="h-4 w-4" />
                      </Button>
                    }
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
