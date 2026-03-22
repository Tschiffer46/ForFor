'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'

interface OrderFormProps {
  trigger: React.ReactNode
  campaigns: { id: string; name: string }[]
  teams: { id: string; name: string }[]
  products: { id: string; name: string; price: number }[]
  order?: {
    id: string
    customerId: string
    customerName: string
    campaignId: string
    teamId: string
    status: 'OBETALD' | 'BETALD'
    comment: string | null
    items: { productId: string; quantity: number }[]
  }
}

export function OrderForm({ trigger, campaigns, teams, products, order }: OrderFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<
    { id: string; name: string; customerNumber: string }[]
  >([])
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string
    name: string
    customerNumber: string
  } | null>(order ? { id: order.customerId, name: order.customerName, customerNumber: '' } : null)
  const [searching, setSearching] = useState(false)

  const [campaignId, setCampaignId] = useState(order?.campaignId || campaigns[0]?.id || '')
  const [teamId, setTeamId] = useState(order?.teamId || teams[0]?.id || '')
  const [status, setStatus] = useState<'OBETALD' | 'BETALD'>(order?.status || 'OBETALD')
  const [comment, setComment] = useState(order?.comment || '')
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    if (order?.items) {
      const q: Record<string, number> = {}
      order.items.forEach((i) => {
        q[i.productId] = i.quantity
      })
      return q
    }
    return {}
  })

  // Search customers
  useEffect(() => {
    if (customerSearch.length < 2) {
      setCustomerResults([])
      return
    }

    const timeout = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/admin/kunder?q=${encodeURIComponent(customerSearch)}`)
        if (res.ok) {
          const data = await res.json()
          setCustomerResults(data.customers || [])
        }
      } catch {
        // ignore
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [customerSearch])

  const totalAmount = products.reduce((sum, p) => {
    const qty = quantities[p.id] || 0
    return sum + p.price * qty
  }, 0)

  const hasItems = Object.values(quantities).some((q) => q > 0)

  const handleSubmit = async () => {
    if (!selectedCustomer || !hasItems) return
    setLoading(true)

    const items = products
      .filter((p) => (quantities[p.id] || 0) > 0)
      .map((p) => ({ productId: p.id, quantity: quantities[p.id] }))

    try {
      const url = order
        ? `/api/admin/bestallningar/${order.id}`
        : '/api/admin/bestallningar'
      const method = order ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          campaignId,
          teamId,
          items,
          status,
          comment: comment || undefined,
        }),
      })

      if (!res.ok) throw new Error('Failed')

      setOpen(false)
      router.refresh()
    } catch {
      alert('Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? 'Redigera beställning' : 'Ny beställning'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Customer search */}
          <div className="space-y-2">
            <Label>Kund</Label>
            {selectedCustomer ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedCustomer.name}
                  {selectedCustomer.customerNumber && (
                    <span className="text-gray-500 ml-1">({selectedCustomer.customerNumber})</span>
                  )}
                </span>
                {!order && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCustomer(null)
                      setCustomerSearch('')
                    }}
                  >
                    Byt
                  </Button>
                )}
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="Sök kund..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  autoFocus
                />
                {customerResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                        onClick={() => {
                          setSelectedCustomer(c)
                          setCustomerSearch('')
                          setCustomerResults([])
                        }}
                      >
                        {c.name}{' '}
                        <span className="text-gray-500">({c.customerNumber})</span>
                      </button>
                    ))}
                  </div>
                )}
                {searching && (
                  <p className="text-xs text-gray-500 mt-1">Söker...</p>
                )}
              </div>
            )}
          </div>

          {/* Campaign */}
          <div className="space-y-2">
            <Label>Kampanj</Label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Team */}
          <div className="space-y-2">
            <Label>Team</Label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'OBETALD' | 'BETALD')}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="OBETALD">Obetald</option>
              <option value="BETALD">Betald</option>
            </select>
          </div>

          {/* Products */}
          <div className="space-y-2">
            <Label>Produkter</Label>
            <div className="space-y-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(product.price)}/st</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() =>
                        setQuantities((q) => ({
                          ...q,
                          [product.id]: Math.max(0, (q[product.id] || 0) - 1),
                        }))
                      }
                    >
                      -
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">
                      {quantities[product.id] || 0}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() =>
                        setQuantities((q) => ({
                          ...q,
                          [product.id]: (q[product.id] || 0) + 1,
                        }))
                      }
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label>Kommentar (valfri)</Label>
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Notering..."
            />
          </div>

          {/* Total */}
          {hasItems && (
            <div className="text-right font-semibold text-lg">
              Totalt: {formatCurrency(totalAmount)}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Avbryt
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedCustomer || !hasItems}
          >
            {loading ? 'Sparar...' : order ? 'Uppdatera' : 'Skapa beställning'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
