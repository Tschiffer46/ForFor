'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle, ShoppingBag, ArrowLeft } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  imageUrl: string | null
  size: string | null
}

interface OrderPageProps {
  slug: string
  clubName: string
  customerPrefix: string
  campaignName: string
  deliveryStart: string | null
  deliveryEnd: string | null
  products: Product[]
}

interface OrderItem {
  name: string
  quantity: number
  unitPrice: number
}

type Step = 'products' | 'identify' | 'summary'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function OrderPage({
  slug,
  clubName,
  customerPrefix,
  campaignName,
  deliveryStart,
  deliveryEnd,
  products,
}: OrderPageProps) {
  const [step, setStep] = useState<Step>('products')

  // Products step
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  // Identify step
  const [mode, setMode] = useState<'existing' | 'new' | null>(null)
  const [customerNumber, setCustomerNumber] = useState('')
  const [lookupResult, setLookupResult] = useState<{
    id: string
    name: string
    customerNumber: string
    subscription: boolean
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

  // Submit state
  const [orderResult, setOrderResult] = useState<{
    totalAmount: number
    swishQrCode?: string
    customerName: string
    items: OrderItem[]
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
      body.customerNumber = lookupResult.customerNumber
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
        setStep('summary')
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

  const canProceedFromIdentify =
    (mode === 'existing' && lookupResult) ||
    (mode === 'new' && newName.trim() && newStreet.trim() && newCity.trim())

  // ── Step 1: Products ──
  if (step === 'products') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">
            Välkommen till {clubName}s försäljning!
          </h2>
          <p className="text-gray-600 mt-2">
            Tack för att du stödjer vår förening! Välj de produkter du vill
            beställa nedan.
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

        {/* Sticky bottom bar */}
        {hasItems && (
          <div className="sticky bottom-0 bg-white border-t p-4 -mx-4 shadow-lg">
            <div className="max-w-2xl mx-auto flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totalt</p>
                <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
              <Button size="lg" onClick={() => setStep('identify')}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Gå vidare
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Step 2: Identify ──
  if (step === 'identify') {
    return (
      <div className="space-y-6">
        <div>
          <button
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
            onClick={() => setStep('products')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Tillbaka till produkter
          </button>
          <h2 className="text-2xl font-bold">Dina uppgifter</h2>
          <p className="text-gray-600 mt-1">
            Har du beställt förut? Ange ditt kundnummer. Annars, fyll i dina
            uppgifter.
          </p>
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
            <p className="text-sm text-gray-600">T.ex. {customerPrefix}-10001</p>
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
                  placeholder={`Kundnummer, t.ex. ${customerPrefix}-10001`}
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                />
                <Button onClick={handleLookup} disabled={lookupLoading}>
                  {lookupLoading ? 'Söker...' : 'Sök'}
                </Button>
              </div>
              {lookupError && (
                <p className="text-sm text-red-600">{lookupError}</p>
              )}
              {lookupResult && (
                <div className="p-3 rounded bg-green-50 text-sm">
                  <p className="font-medium">{lookupResult.name}</p>
                  <p className="text-gray-600">
                    {lookupResult.address.street},{' '}
                    {lookupResult.address.postalCode}{' '}
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
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Gatuadress *</Label>
                <Input
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                />
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
                  <Input
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Telefon</Label>
                  <Input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
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

        {submitError && (
          <p className="text-sm text-red-600 text-center">{submitError}</p>
        )}

        {mode && (
          <div className="sticky bottom-0 bg-white border-t p-4 -mx-4 shadow-lg">
            <div className="max-w-2xl mx-auto flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totalt</p>
                <p className="text-xl font-bold">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <Button
                size="lg"
                disabled={!canProceedFromIdentify || submitting}
                onClick={handleSubmitOrder}
              >
                {submitting ? 'Beställer...' : 'Skicka beställning'}
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Step 3: Summary ──
  if (step === 'summary' && orderResult) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
          <h2 className="text-2xl font-bold mt-4">
            Tack för din beställning, {orderResult.customerName}!
          </h2>
          <p className="text-gray-600 mt-1">
            Din beställning är registrerad och vi ser fram emot att leverera
            till dig.
          </p>
        </div>

        {/* Order items */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Din beställning</h3>
            <div className="divide-y">
              {orderResult.items.map((item, i) => (
                <div key={i} className="flex justify-between py-2">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-3 mt-3 border-t font-bold text-lg">
              <span>Totalt</span>
              <span>{formatCurrency(orderResult.totalAmount)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        {orderResult.swishQrCode && (
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <h3 className="font-semibold">Betala med Swish</h3>
              <img
                src={orderResult.swishQrCode}
                alt="Swish QR-kod"
                className="w-48 h-48 mx-auto"
              />
              <p className="text-sm text-gray-500">
                Skanna QR-koden med din Swish-app
              </p>
            </CardContent>
          </Card>
        )}

        {/* Delivery info */}
        {(deliveryStart || deliveryEnd) && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Leveransinformation</h3>
              <p className="text-gray-600">
                {deliveryStart && deliveryEnd ? (
                  <>
                    Leverans sker mellan{' '}
                    <span className="font-medium">
                      {formatDate(deliveryStart)}
                    </span>{' '}
                    och{' '}
                    <span className="font-medium">
                      {formatDate(deliveryEnd)}
                    </span>
                    .
                  </>
                ) : deliveryStart ? (
                  <>
                    Leverans börjar{' '}
                    <span className="font-medium">
                      {formatDate(deliveryStart)}
                    </span>
                    .
                  </>
                ) : (
                  <>
                    Leverans senast{' '}
                    <span className="font-medium">
                      {formatDate(deliveryEnd!)}
                    </span>
                    .
                  </>
                )}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Varorna levereras till din dörr av {clubName}s säljare.
              </p>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-sm text-gray-500">
          Tack för att du stödjer {clubName}!
        </p>
      </div>
    )
  }

  return null
}
