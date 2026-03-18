'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import DeliveryTable, { type SerializedDelivery } from '@/components/admin/delivery-table'

interface DeliveryTableWrapperProps {
  deliveries: SerializedDelivery[]
}

export default function DeliveryTableWrapper({ deliveries: initialDeliveries }: DeliveryTableWrapperProps) {
  const router = useRouter()
  const [deliveries, setDeliveries] = useState(initialDeliveries)

  const handleStatusUpdate = useCallback(async (deliveryId: string, status: string) => {
    const res = await fetch(`/api/admin/deliveries/${deliveryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (res.ok) {
      // Optimistic update
      setDeliveries((prev) =>
        prev.map((d) =>
          d.deliveryId === deliveryId
            ? { ...d, deliveryStatus: status as SerializedDelivery['deliveryStatus'] }
            : d
        )
      )
    }
  }, [])

  const handleNotesUpdate = useCallback(async (deliveryId: string, notes: string) => {
    const res = await fetch(`/api/admin/deliveries/${deliveryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })

    if (res.ok) {
      setDeliveries((prev) =>
        prev.map((d) =>
          d.deliveryId === deliveryId ? { ...d, deliveryNotes: notes } : d
        )
      )
    }
  }, [])

  return (
    <DeliveryTable
      deliveries={deliveries}
      onStatusUpdate={handleStatusUpdate}
      onNotesUpdate={handleNotesUpdate}
    />
  )
}
