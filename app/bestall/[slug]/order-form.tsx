'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  imageUrl: string | null
  size: string | null
}

interface OrderPageProps {
  slug: string
  campaignName: string
  products: Product[]
}

type Step = 'identify' | 'products' | 'confirmation'

export function OrderPage({ slug, campaignName, products }: OrderPageProps) {
  const [step, setStep] = useState<Step>('identify')

  // Identify step
  const [mode, setMode] = useState<'existing' | 'new' | null>(null)
  const [customerNumber, setCustomerNumber] = useState('')
  const [lookupResult, setLookupResult] = useState<{
    id: string
    name: string
    address: { street: string; postalCode: string; city: string }
  } | null>(null)
  const [lookupError, setLookupError] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)

  // New customer fields
  const [newName, setNewName] = useState('')
  const [newStreet, setNewStreet] = useState('')
  const [newPostalCode, setNewPostalCode] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')

  // Products step
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  // Confirmation step
  const [orderResult, setOrderResult] = useState<{
    totalAmount: number
    swishQrCode?: string
    customerName: string
  } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const totalAmount = products.reduce(
    (sum, p) => sum + p.price * (quantities[p.id] || 0),
    0
  )
  const hasItems = Object.values(quantities).some((q) => q > 0)

  const handleLookup = async () => {
    if (!customerNumber.trim()) return
    setLookupLoading(true)
    setLookupError('')

    try {
      const res = await fetch(
        `/api/bestall/${slug}/customer?customerNumber=${encodeURIComponent(customerNumber.trim())}`
      )
      if (res.ok) {
        const data = await res.json()
        setLookupResult(data)
      } else {
        setLookupError('Kundnumret hittades inte. Kontrollera och försök igen.')
      }
    } catch {
      setLookupError('Något gick fel. Försök igen.')
    } finally {
      setLookupLoading(false)
    }
  }

  const handleSubmitOrder = async () => {
    setSubmitting(true)
    setSubmitError('')

    const items = products
      .filter((p) => (quantities[p.id] || 0) > 0)
      .map((p) => ({ productId: p.id, quantity: quantities[p.id] }))

    const body: Record<string, unknown> = { items }

    if (mode === 'existing' && lookupResult) {
      body.customerNumber = customerNumber.trim()
    } else if (mode === 'new') {
      body.newCustomer = {
        name: newName.trim(),
        street: newStreet.trim(),
        postalCode: newPostalCode.trim(),
        city: newCity.trim(),
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
      }
    }

    try {
      const res = await fetch(`/api/bestall/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const data = await res.json()
        setOrderResult(data)
        setStep('confirmation')
      } else {
        const err = await res.json().catch(() => ({}))
        setSubmitError(err.error || 'Något gick fel. Försök igen.')
      }
    } catch {
      setSubmitError('Något gick fel. Försök igen.')
    } finally {
      setSubmitting(false)
    }
  }

  // Can proceed from identify step?
  const canProceedFromIdentify =
    (mode === 'existing' && lookupResult) ||
    (mode === 'new' && newName.trim() && newStreet.trim() && newCity.trim())

  if (step === 'identify') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Beställ från {campaignName}</h2>
          <p className="text-gray-600 mt-1">Välj hur du vill identifiera dig</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              mode === 'existing'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setMode('existing')}
          >
            <p className="font-semibold">Jag har ett kundnummer</p>
            <p className="text-sm text-gray-600">T.ex. UIF-10001</p>
          </button>
          <button
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              mode === 'new'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setMode('new')}
          >
            <p className="font-semibold">Jag är ny kund</p>
            <p className="text-sm text-gray-600">Fyll i dina uppgifter</p>
          </button>
        </div>

        {mode === 'existing' && (
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Kundnummer, t.ex. UIF-10001"
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                />
                <Button onClick={handleLookup} disabled={lookupLoading}>
                  {lookupLoading ? 'Söker...' : 'Sök'}
                </Button>
              </div>
              {lookupError && <p className="text-sm text-red-600">{lookupError}</p>}
              {lookupResult && (
                <div className="p-3 rounded bg-green-50 text-sm">
                  <p className="font-medium">{lookupResult.name}</p>
                  <p className="text-gray-600">
                    {lookupResult.address.street}, {lookupResult.address.postalCode}{' '}
                    {lookupResult.address.city}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {mode === 'new' && (
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-1">
                <Label>Namn *</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Gatuadress *</Label>
                <Input value={newStreet} onChange={(e) => setNewStreet(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Postnummer</Label>
                  <Input
                    value={newPostalCode}
                    onChange={(e) => setNewPostalCode(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Stad *</Label>
                  <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Telefon</Label>
                  <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>E-post</Label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {mode && (
          <Button
            className="w-full"
            size="lg"
            disabled={!canProceedFromIdentify}
            onClick={() => setStep('products')}
          >
            Välj produkter
          </Button>
        )}
      </div>
    )
  }

  if (step === 'products') {
    const customerName =
      mode === 'existing' ? lookupResult?.name : newName.trim()

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Välj produkter</h2>
          <p className="text-gray-600 mt-1">
            Beställning för <span className="font-medium">{customerName}</span>
          </p>
        </div>

        <div className="space-y-3">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-4">
                  {product.imageUrl && (
                    <img
                      src={`/api/uploads/${product.imageUrl}`}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{product.name}</p>
                    {product.size && (
                      <p className="text-sm text-gray-500">{product.size}</p>
                    )}
                    <p className="text-sm font-medium">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() =>
                        setQuantities((q) => ({
                          ...q,
                          [product.id]: Math.max(0, (q[product.id] || 0) - 1),
                        }))
                      }
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {quantities[product.id] || 0}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
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
              </CardContent>
            </Card>
          ))}
        </div>

        {submitError && (
          <p className="text-sm text-red-600 text-center">{submitError}</p>
        )}

        {/* Sticky bottom bar */}
        <div className="sticky bottom-0 bg-white border-t p-4 -mx-4 shadow-lg">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totalt</p>
              <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('identify')}>
                Tillbaka
              </Button>
              <Button
                size="lg"
                disabled={!hasItems || submitting}
                onClick={handleSubmitOrder}
              >
                {submitting ? 'Beställer...' : 'Beställ'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Confirmation step
  if (step === 'confirmation' && orderResult) {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold">Tack för din beställning!</h2>
          <p className="text-gray-600 mt-1">
            {orderResult.customerName}, din beställning är registrerad.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <p className="text-sm text-gray-600">Att betala</p>
              <p className="text-3xl font-bold">
                {formatCurrency(orderResult.totalAmount)}
              </p>
            </div>

            {orderResult.swishQrCode && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Betala med Swish</p>
                <img
                  src={orderResult.swishQrCode}
                  alt="Swish QR-kod"
                  className="w-48 h-48 mx-auto"
                />
                <p className="text-xs text-gray-500">
                  Skanna QR-koden med din Swish-app
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-sm text-gray-500">
          Du kan stänga denna sida. Leveransinformation kommer via{' '}
          {campaignName}.
        </p>
      </div>
    )
  }

  return null
}
