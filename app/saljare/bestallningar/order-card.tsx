'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Mail, Phone } from 'lucide-react'

interface OrderCardProps {
  order: {
    id: string
    status: string
    totalAmount: number
    swishQrCode: string | null
    createdAt: string
    customer: {
      name: string
      phone: string | null
      email: string | null
      address: string
    }
    items: {
      id: string
      quantity: number
      unitPrice: number
      discountApplied: boolean
      product: { name: string }
    }[]
    campaign: { name: string }
  }
}

export function OrderCard({ order: initialOrder }: OrderCardProps) {
  const [order, setOrder] = useState(initialOrder)
  const [marking, setMarking] = useState(false)
  const [receiptSent, setReceiptSent] = useState(false)

  async function markAsPaid() {
    setMarking(true)
    try {
      const res = await fetch(`/api/saljare/orders/${order.id}/pay`, {
        method: 'PATCH',
      })
      if (res.ok) {
        setOrder((prev) => ({ ...prev, status: 'BETALD' }))
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setMarking(false)
    }
  }

  async function sendReceipt(method: 'email' | 'sms') {
    const to = method === 'email' ? order.customer.email : order.customer.phone
    if (!to) return
    try {
      const res = await fetch(`/api/saljare/orders/${order.id}/receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, to }),
      })
      if (res.ok) {
        setReceiptSent(true)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(amount)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('sv-SE')

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{order.customer.name}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{order.customer.address}</p>
          </div>
          <Badge
            variant={order.status === 'BETALD' ? 'success' : 'warning'}
            className="text-sm"
          >
            {order.status === 'BETALD' ? 'Betald' : 'Obetald'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Products */}
        <div className="bg-gray-50 p-3 rounded space-y-2">
          <p className="text-sm font-medium text-gray-700">Produkter:</p>
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <span>{item.quantity}x {item.product.name}</span>
              <span className="font-medium">{formatCurrency(item.quantity * item.unitPrice)}</span>
            </div>
          ))}
          {order.items.some((item) => item.discountApplied) && (
            <p className="text-xs font-medium" style={{ color: 'var(--club-primary, #15803d)' }}>
              Prenumerationsrabatt tillämpad (10%)
            </p>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="font-bold text-lg">Totalt:</span>
          <span className="font-bold text-xl" style={{ color: 'var(--club-primary, #15803d)' }}>
            {formatCurrency(order.totalAmount)}
          </span>
        </div>

        {/* Metadata */}
        <div className="pt-2 border-t text-xs text-gray-500 space-y-1">
          <p>Kampanj: {order.campaign.name}</p>
          <p>Datum: {formatDate(order.createdAt)}</p>
        </div>

        {/* Swish QR */}
        {order.swishQrCode && order.status !== 'BETALD' && (
          <div className="pt-3 border-t text-center">
            <p className="text-sm font-medium text-gray-700 mb-2">Swish QR-kod:</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={order.swishQrCode}
              alt="Swish QR-kod"
              className="w-32 h-32 mx-auto"
            />
            <p className="text-xs text-gray-500 mt-2">Visa denna kod för kunden</p>
          </div>
        )}

        {/* Actions for unpaid orders */}
        {order.status !== 'BETALD' && (
          <div className="pt-3 border-t">
            <Button
              className="w-full h-12"
              onClick={markAsPaid}
              disabled={marking}
              style={{ backgroundColor: 'var(--club-primary, #15803d)' }}
            >
              <Check className="mr-2 h-4 w-4" />
              {marking ? 'Markerar...' : 'Markera som betald'}
            </Button>
          </div>
        )}

        {/* Receipt buttons */}
        {!receiptSent && (
          <div className="flex gap-2">
            {order.customer.email && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => sendReceipt('email')}
              >
                <Mail className="mr-1 h-4 w-4" />
                Skicka kvitto
              </Button>
            )}
            {order.customer.phone && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => sendReceipt('sms')}
              >
                <Phone className="mr-1 h-4 w-4" />
                SMS-kvitto
              </Button>
            )}
          </div>
        )}

        {receiptSent && (
          <p className="text-xs text-center" style={{ color: 'var(--club-primary, #15803d)' }}>
            Kvitto skickat!
          </p>
        )}
      </CardContent>
    </Card>
  )
}
