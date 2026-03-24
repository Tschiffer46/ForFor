'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import {
  CheckCircle,
  ShoppingBag,
  ArrowLeft,
  Search,
  CalendarDays,
  Truck,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  imagePath: string | null
  size: string | null
  description: string | null
}

interface OrderPageProps {
  slug: string
  clubName: string
  customerPrefix: string
  campaignName: string
  salesStart: string
  salesEnd: string
  deliveryStart: string | null
  deliveryEnd: string | null
  products: Product[]
}

interface OrderItem {
  name: string
  quantity: number
  unitPrice: number
}

interface SearchResult {
  id: string
  name: string
  customerNumber: string
  subscription: boolean
  email: string | null
  phone: string | null
  address: { street: string; postalCode: string; city: string }
}

type Step = 'products' | 'identify' | 'payment' | 'summary'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long',
  })
}

function formatDateLong(iso: string): string {
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
  salesStart,
  salesEnd,
  deliveryStart,
  deliveryEnd,
  products,
}: OrderPageProps) {
  const [step, setStep] = useState<Step>('products')

  // Products step
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  // Identify step
  const [mode, setMode] = useState<'search' | 'new' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<SearchResult | null>(
    null
  )

  // Contact confirmation
  const [confirmEmail, setConfirmEmail] = useState('')
  const [confirmPhone, setConfirmPhone] = useState('')

  // New customer fields
  const [newName, setNewName] = useState('')
  const [newStreet, setNewStreet] = useState('')
  const [newPostalCode, setNewPostalCode] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')

  // Payment/submit state
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

  // Debounced search
  const handleSearch = useCallback(
    async (q: string) => {
      setSearchQuery(q)
      if (q.trim().length < 2) {
        setSearchResults([])
        return
      }
      setSearchLoading(true)
      try {
        const res = await fetch(
          `/api/bestall/${slug}/search?q=${encodeURIComponent(q.trim())}`
        )
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.results)
        }
      } catch {
        // ignore
      } finally {
        setSearchLoading(false)
      }
    },
    [slug]
  )

  const selectCustomer = (customer: SearchResult) => {
    setSelectedCustomer(customer)
    setConfirmEmail(customer.email || '')
    setConfirmPhone(customer.phone || '')
    setSearchResults([])
  }

  const handleSubmitOrder = async () => {
    setSubmitting(true)
    setSubmitError('')

    const items = products
      .filter((p) => (quantities[p.id] || 0) > 0)
      .map((p) => ({ productId: p.id, quantity: quantities[p.id] }))

    const body: Record<string, unknown> = { items }

    if (selectedCustomer) {
      body.customerId = selectedCustomer.id
      body.customerEmail = confirmEmail.trim() || undefined
      body.customerPhone = confirmPhone.trim() || undefined
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
        setStep('payment')
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
    selectedCustomer ||
    (mode === 'new' && newName.trim() && newStreet.trim() && newCity.trim())

  // ── Step 1: Products ──
  if (step === 'products') {
    return (
      <div className="space-y-6">
        {/* Welcome + campaign info */}
        <div>
          <h2 className="text-2xl font-bold">
            Välkommen till {clubName}s försäljning!
          </h2>
          <p className="text-gray-600 mt-2">
            Tack för att du stödjer vår förening! Välj de produkter du vill
            beställa nedan.
          </p>
        </div>

        {/* Campaign dates */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarDays className="h-4 w-4" />
            <span>
              Försäljning: {formatDate(salesStart)} &ndash;{' '}
              {formatDate(salesEnd)}
            </span>
          </div>
          {(deliveryStart || deliveryEnd) && (
            <div className="flex items-center gap-2 text-gray-600">
              <Truck className="h-4 w-4" />
              <span>
                Leverans:{' '}
                {deliveryStart && deliveryEnd
                  ? `${formatDate(deliveryStart)} – ${formatDate(deliveryEnd)}`
                  : deliveryStart
                    ? `fr.o.m. ${formatDate(deliveryStart)}`
                    : `senast ${formatDate(deliveryEnd!)}`}
              </span>
            </div>
          )}
        </div>

        {/* Product cards */}
        <div className="space-y-3">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-4">
                  {product.imagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/uploads/${product.imagePath}`}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                      Bild
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{product.name}</p>
                    {product.size && (
                      <p className="text-sm text-gray-500">{product.size}</p>
                    )}
                    {product.description && (
                      <p className="text-xs text-gray-400 line-clamp-1">
                        {product.description}
                      </p>
                    )}
                    <p className="text-sm font-medium mt-0.5">
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
                <p className="text-xl font-bold">
                  {formatCurrency(totalAmount)}
                </p>
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
            Sök efter ditt kundnummer eller din adress, eller registrera dig som
            ny kund.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              mode === 'search'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => {
              setMode('search')
              setSelectedCustomer(null)
            }}
          >
            <p className="font-semibold">Jag har beställt förut</p>
            <p className="text-sm text-gray-600">
              Sök på kundnummer, namn eller adress
            </p>
          </button>
          <button
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              mode === 'new'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => {
              setMode('new')
              setSelectedCustomer(null)
            }}
          >
            <p className="font-semibold">Jag är ny kund</p>
            <p className="text-sm text-gray-600">Fyll i dina uppgifter</p>
          </button>
        </div>

        {/* Search mode */}
        {mode === 'search' && !selectedCustomer && (
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder={`Sök på kundnummer (${customerPrefix}-10001), namn eller gatuadress...`}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              {searchLoading && (
                <p className="text-sm text-gray-500">Söker...</p>
              )}
              {searchResults.length > 0 && (
                <div className="divide-y rounded-lg border max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                      onClick={() => selectCustomer(result)}
                    >
                      <p className="font-medium text-sm">{result.name}</p>
                      <p className="text-xs text-gray-500">
                        {result.customerNumber} &middot;{' '}
                        {result.address.street}, {result.address.city}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              {!searchLoading &&
                searchQuery.length >= 2 &&
                searchResults.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Ingen träff. Prova ett annat sökord eller registrera dig som
                    ny kund.
                  </p>
                )}
            </CardContent>
          </Card>
        )}

        {/* Selected customer — confirm details */}
        {selectedCustomer && (
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="p-3 rounded bg-green-50">
                <p className="font-medium">{selectedCustomer.name}</p>
                <p className="text-sm text-gray-600">
                  {selectedCustomer.customerNumber} &middot;{' '}
                  {selectedCustomer.address.street},{' '}
                  {selectedCustomer.address.postalCode}{' '}
                  {selectedCustomer.address.city}
                </p>
              </div>
              <p className="text-sm font-medium">
                Bekräfta dina kontaktuppgifter:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">E-post</Label>
                  <Input
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder="din@email.se"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Telefon</Label>
                  <Input
                    value={confirmPhone}
                    onChange={(e) => setConfirmPhone(e.target.value)}
                    placeholder="070-123 45 67"
                  />
                </div>
              </div>
              <button
                className="text-xs text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setSelectedCustomer(null)
                  setSearchQuery('')
                }}
              >
                Inte du? Sök igen
              </button>
            </CardContent>
          </Card>
        )}

        {/* New customer form */}
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

  // ── Step 3: Payment ──
  if (step === 'payment' && orderResult) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Betala med Swish</h2>
          <p className="text-gray-600 mt-1">
            Skanna QR-koden nedan med din Swish-app för att betala.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <div>
              <p className="text-sm text-gray-600">Att betala</p>
              <p className="text-3xl font-bold">
                {formatCurrency(orderResult.totalAmount)}
              </p>
            </div>

            {orderResult.swishQrCode && (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={orderResult.swishQrCode}
                  alt="Swish QR-kod"
                  className="w-48 h-48 mx-auto"
                />
                <p className="text-xs text-gray-500">
                  Öppna Swish-appen och skanna koden
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="w-full"
          onClick={() => setStep('summary')}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Jag har betalat
        </Button>

        <p className="text-center text-xs text-gray-400">
          Tryck på knappen ovan när du har genomfört din Swish-betalning.
        </p>
      </div>
    )
  }

  // ── Step 4: Summary ──
  if (step === 'summary' && orderResult) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
          <h2 className="text-2xl font-bold mt-4">
            Tack för din beställning, {orderResult.customerName}!
          </h2>
          <p className="text-gray-600 mt-1">
            Din beställning är registrerad och bekräftad.
            {confirmEmail && (
              <>
                {' '}
                En bekräftelse har skickats till{' '}
                <span className="font-medium">{confirmEmail}</span>.
              </>
            )}
            {!confirmEmail && newEmail && (
              <>
                {' '}
                En bekräftelse har skickats till{' '}
                <span className="font-medium">{newEmail}</span>.
              </>
            )}
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

        {/* Delivery info */}
        {(deliveryStart || deliveryEnd) && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Truck className="h-5 w-5" /> Leveransinformation
              </h3>
              <p className="text-gray-600">
                {deliveryStart && deliveryEnd ? (
                  <>
                    Leverans sker mellan{' '}
                    <span className="font-medium">
                      {formatDateLong(deliveryStart)}
                    </span>{' '}
                    och{' '}
                    <span className="font-medium">
                      {formatDateLong(deliveryEnd)}
                    </span>
                    .
                  </>
                ) : deliveryStart ? (
                  <>
                    Leverans börjar{' '}
                    <span className="font-medium">
                      {formatDateLong(deliveryStart)}
                    </span>
                    .
                  </>
                ) : (
                  <>
                    Leverans senast{' '}
                    <span className="font-medium">
                      {formatDateLong(deliveryEnd!)}
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
