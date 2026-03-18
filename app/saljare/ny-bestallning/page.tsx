'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Check, Search, Plus, Minus, Mail, Phone, CreditCard } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

interface Address {
  id: string
  street: string
  postalCode: string
  city: string
  streetRef: { name: string; city: string }
  customers: Customer[]
}

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  subscription: boolean
  orders: RecentOrder[]
}

interface RecentOrder {
  id: string
  totalAmount: number
  status: string
  createdAt: string
  items: { quantity: number; product: { name: string } }[]
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  size: string | null
  images: { imagePath: string }[]
}

interface OrderItem {
  productId: string
  quantity: number
}

interface CreatedOrder {
  id: string
  totalAmount: number
  swishQrCode: string | null
  items: { quantity: number; unitPrice: number; product: { name: string } }[]
}

type Step = 'identify' | 'products' | 'payment'

// ─── Main Component ──────────────────────────────────────

export default function NyBestallningPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('identify')

  // Step 1: Identify customer
  const [searchQuery, setSearchQuery] = useState('')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // New customer form
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')

  // Step 2: Products
  const [products, setProducts] = useState<Product[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Step 3: Payment
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [paymentAction, setPaymentAction] = useState<'paid' | 'later' | null>(null)
  const [receiptMethod, setReceiptMethod] = useState<'email' | 'sms' | null>(null)
  const [receiptSent, setReceiptSent] = useState(false)

  // ─── Step 1: Search addresses ──────────────────────────

  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 2) return
    setSearching(true)
    setHasSearched(true)
    try {
      const res = await fetch(`/api/saljare/addresses?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setAddresses(data.addresses)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setAddresses([])
      setHasSearched(false)
      return
    }
    const timer = setTimeout(() => searchAddresses(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchAddresses])

  // ─── Step 2: Load products ─────────────────────────────

  useEffect(() => {
    if (step === 'products' && products.length === 0) {
      setLoadingProducts(true)
      fetch('/api/saljare/products')
        .then((res) => res.json())
        .then((data) => setProducts(data.products))
        .catch(console.error)
        .finally(() => setLoadingProducts(false))
    }
  }, [step, products.length])

  // ─── Handlers ──────────────────────────────────────────

  function selectAddress(address: Address) {
    setSelectedAddress(address)
    if (address.customers.length === 1) {
      // Auto-select if only one customer
      setSelectedCustomer(address.customers[0])
      setStep('products')
    } else if (address.customers.length === 0) {
      setShowNewCustomerForm(true)
    }
  }

  function selectCustomer(customer: Customer) {
    setSelectedCustomer(customer)
    setStep('products')
  }

  async function createCustomer() {
    if (!newCustomerName.trim() || !selectedAddress) return
    try {
      const res = await fetch('/api/saljare/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustomerName.trim(),
          phone: newCustomerPhone || undefined,
          email: newCustomerEmail || undefined,
          subscription: false,
          addressId: selectedAddress.id,
        }),
      })
      if (res.ok) {
        const customer = await res.json()
        setSelectedCustomer(customer)
        setShowNewCustomerForm(false)
        setStep('products')
      }
    } catch (error) {
      console.error('Error creating customer:', error)
    }
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setOrderItems((items) => items.filter((i) => i.productId !== productId))
    } else {
      setOrderItems((items) => {
        const existing = items.find((i) => i.productId === productId)
        if (existing) {
          return items.map((i) => (i.productId === productId ? { ...i, quantity } : i))
        }
        return [...items, { productId, quantity }]
      })
    }
  }

  function calculateTotal() {
    let total = 0
    orderItems.forEach((item) => {
      const product = products.find((p) => p.id === item.productId)
      if (product) total += product.price * item.quantity
    })
    if (selectedCustomer?.subscription) total = total * 0.9
    return Math.round(total)
  }

  async function submitOrder() {
    if (!selectedCustomer || orderItems.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/saljare/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          items: orderItems,
        }),
      })
      if (res.ok) {
        const order = await res.json()
        setCreatedOrder(order)
        setStep('payment')
      } else {
        alert('Kunde inte skapa beställning')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Något gick fel')
    } finally {
      setSubmitting(false)
    }
  }

  async function markAsPaid() {
    if (!createdOrder) return
    try {
      const res = await fetch(`/api/saljare/orders/${createdOrder.id}/pay`, {
        method: 'PATCH',
      })
      if (res.ok) {
        setPaymentAction('paid')
      }
    } catch (error) {
      console.error('Error marking as paid:', error)
    }
  }

  async function sendReceipt(method: 'email' | 'sms') {
    if (!createdOrder || !selectedCustomer) return
    const to = method === 'email' ? selectedCustomer.email : selectedCustomer.phone
    if (!to) {
      alert(method === 'email' ? 'Kunden har ingen e-postadress' : 'Kunden har inget telefonnummer')
      return
    }
    try {
      const res = await fetch(`/api/saljare/orders/${createdOrder.id}/receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, to }),
      })
      if (res.ok) {
        setReceiptMethod(method)
        setReceiptSent(true)
      }
    } catch (error) {
      console.error('Error sending receipt:', error)
    }
  }

  function goBack() {
    if (step === 'products') {
      setStep('identify')
      setOrderItems([])
    } else if (step === 'identify' && (showNewCustomerForm || selectedAddress)) {
      setShowNewCustomerForm(false)
      setSelectedAddress(null)
      setSelectedCustomer(null)
    }
  }

  // ─── Render ────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        {(step !== 'identify' || selectedAddress) && step !== 'payment' && (
          <Button variant="outline" size="icon" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold">Ny beställning</h1>
          <p className="text-sm text-gray-600">
            {step === 'identify' && 'Hitta kund'}
            {step === 'products' && 'Välj produkter'}
            {step === 'payment' && 'Betalning'}
          </p>
        </div>
      </div>

      {/* ─── STEP 1: Identify Customer ─── */}
      {step === 'identify' && !selectedAddress && (
        <>
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök gatunamn..."
              className="h-14 text-lg pl-10"
              autoFocus
            />
          </div>

          {/* Search results */}
          {searching && <p className="text-center text-gray-500 py-4">Söker...</p>}

          {!searching && addresses.length > 0 && (
            <div className="space-y-2">
              {addresses.map((address) => (
                <Card
                  key={address.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => selectAddress(address)}
                >
                  <CardContent className="p-4">
                    <p className="font-bold text-base">{address.street}</p>
                    <p className="text-sm text-gray-600">
                      {address.postalCode} {address.city}
                    </p>
                    {address.customers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {address.customers.map((c) => (
                          <Badge key={c.id} variant="outline" className="text-xs">
                            {c.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!searching && hasSearched && addresses.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">Ingen adress hittades</p>
                <p className="text-sm text-gray-400 mt-1">Försök med ett annat gatunamn</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Address selected — show customers or new customer form */}
      {step === 'identify' && selectedAddress && !showNewCustomerForm && (
        <div className="space-y-3">
          <Card className="border" style={{
            backgroundColor: 'color-mix(in srgb, var(--club-primary, #15803d) 5%, white)',
            borderColor: 'color-mix(in srgb, var(--club-primary, #15803d) 20%, white)',
          }}>
            <CardContent className="p-3">
              <p className="text-sm font-medium">{selectedAddress.street}</p>
              <p className="text-xs text-gray-600">{selectedAddress.postalCode} {selectedAddress.city}</p>
            </CardContent>
          </Card>

          {selectedAddress.customers.length > 0 && (
            <>
              <p className="text-sm font-medium text-gray-700">Kunder på denna adress:</p>
              {selectedAddress.customers.map((customer) => (
                <Card
                  key={customer.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => selectCustomer(customer)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-base">{customer.name}</p>
                        {customer.phone && (
                          <p className="text-sm text-gray-600">{customer.phone}</p>
                        )}
                        {customer.email && (
                          <p className="text-sm text-gray-600">{customer.email}</p>
                        )}
                      </div>
                      {customer.subscription && (
                        <Badge variant="success" className="text-xs">10% rabatt</Badge>
                      )}
                    </div>
                    {/* Recent orders */}
                    {customer.orders.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs font-medium text-gray-500 mb-1">Senaste beställningar:</p>
                        {customer.orders.map((order) => (
                          <div key={order.id} className="flex justify-between text-xs text-gray-600">
                            <span>
                              {order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ')}
                            </span>
                            <span className="font-medium">{order.totalAmount} kr</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => setShowNewCustomerForm(true)}
          >
            + Ny kund på denna adress
          </Button>
        </div>
      )}

      {/* New customer form */}
      {step === 'identify' && showNewCustomerForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ny kund</CardTitle>
            {selectedAddress && (
              <p className="text-sm text-gray-600">{selectedAddress.street}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Namn *</label>
              <Input
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Kundens namn"
                className="h-12 text-base"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium">Telefon</label>
              <Input
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="070-1234567"
                className="h-12 text-base"
                type="tel"
              />
            </div>
            <div>
              <label className="text-sm font-medium">E-post</label>
              <Input
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                placeholder="kund@exempel.se"
                className="h-12 text-base"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={() => setShowNewCustomerForm(false)}
              >
                Avbryt
              </Button>
              <Button
                className="flex-1 h-12"
                onClick={createCustomer}
                disabled={!newCustomerName.trim()}
                style={{ backgroundColor: 'var(--club-primary, #15803d)' }}
              >
                Skapa kund
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 2: Select Products ─── */}
      {step === 'products' && (
        <>
          {/* Customer info bar */}
          <Card className="border" style={{
            backgroundColor: 'color-mix(in srgb, var(--club-primary, #15803d) 5%, white)',
            borderColor: 'color-mix(in srgb, var(--club-primary, #15803d) 20%, white)',
          }}>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{selectedCustomer?.name}</p>
                <p className="text-xs text-gray-600">{selectedAddress?.street}</p>
              </div>
              {selectedCustomer?.subscription && (
                <Badge variant="success" className="text-xs">10% rabatt</Badge>
              )}
            </CardContent>
          </Card>

          {loadingProducts ? (
            <p className="text-center text-gray-500 py-8">Laddar produkter...</p>
          ) : (
            <div className="space-y-3">
              {products.map((product) => {
                const item = orderItems.find((i) => i.productId === product.id)
                const quantity = item?.quantity || 0

                return (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {/* Product image */}
                        {product.images[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/uploads/${product.images[0].imagePath}`}
                            alt={product.name}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold">{product.name}</p>
                          {product.size && (
                            <p className="text-xs text-gray-500">{product.size}</p>
                          )}
                          {product.description && (
                            <p className="text-sm text-gray-600 truncate">{product.description}</p>
                          )}
                          <p className="text-lg font-bold mt-1" style={{ color: 'var(--club-primary, #15803d)' }}>
                            {product.price} kr
                          </p>
                        </div>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center justify-center gap-4 mt-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          disabled={quantity === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-2xl font-bold min-w-[3ch] text-center">
                          {quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Sticky total bar */}
          {orderItems.length > 0 && (
            <div className="fixed bottom-20 left-0 right-0 bg-white border-t shadow-lg p-4 z-10">
              <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-lg">Total:</span>
                  <span className="font-bold text-2xl" style={{ color: 'var(--club-primary, #15803d)' }}>
                    {calculateTotal()} kr
                  </span>
                </div>
                {selectedCustomer?.subscription && (
                  <p className="text-xs mb-2" style={{ color: 'var(--club-primary, #15803d)' }}>
                    Inkl. 10% prenumerationsrabatt
                  </p>
                )}
                <Button
                  className="w-full h-14 text-lg"
                  onClick={submitOrder}
                  disabled={submitting}
                  style={{ backgroundColor: 'var(--club-primary, #15803d)' }}
                >
                  {submitting ? 'Skapar beställning...' : 'Gå till betalning'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── STEP 3: Payment ─── */}
      {step === 'payment' && createdOrder && (
        <div className="space-y-4">
          {/* Order summary */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">Beställning skapad</p>
              <div className="space-y-1">
                {createdOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.product.name}</span>
                    <span className="font-medium">{item.quantity * item.unitPrice} kr</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                  <span>Total:</span>
                  <span style={{ color: 'var(--club-primary, #15803d)' }}>
                    {createdOrder.totalAmount} kr
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment not yet decided */}
          {!paymentAction && (
            <>
              {/* Swish QR */}
              {createdOrder.swishQrCode && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CreditCard className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--club-primary, #15803d)' }} />
                    <p className="font-bold text-lg mb-3">Betala med Swish</p>
                    <p className="text-sm text-gray-600 mb-4">
                      Visa denna QR-kod för kunden
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={createdOrder.swishQrCode}
                      alt="Swish QR-kod"
                      className="w-48 h-48 mx-auto"
                    />
                  </CardContent>
                </Card>
              )}

              <Button
                className="w-full h-14 text-lg"
                onClick={markAsPaid}
                style={{ backgroundColor: 'var(--club-primary, #15803d)' }}
              >
                <Check className="mr-2 h-5 w-5" />
                Kunden har betalat
              </Button>

              <Button
                variant="outline"
                className="w-full h-12 text-base"
                onClick={() => setPaymentAction('later')}
              >
                Betala senare
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Kunden får en faktura och betalar innan leverans
              </p>
            </>
          )}

          {/* Payment confirmed — choose receipt method */}
          {paymentAction && !receiptSent && (
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                {paymentAction === 'paid' ? (
                  <>
                    <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--club-primary, #15803d) 15%, white)' }}>
                      <Check className="h-8 w-8" style={{ color: 'var(--club-primary, #15803d)' }} />
                    </div>
                    <p className="font-bold text-lg">Betalning mottagen!</p>
                  </>
                ) : (
                  <p className="font-bold text-lg">Faktura skickas senare</p>
                )}

                <p className="text-sm text-gray-600">
                  Hur vill kunden få {paymentAction === 'paid' ? 'kvittot' : 'fakturan'}?
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-14 text-base"
                    onClick={() => sendReceipt('email')}
                    disabled={!selectedCustomer?.email}
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    E-post
                  </Button>
                  <Button
                    variant="outline"
                    className="h-14 text-base"
                    onClick={() => sendReceipt('sms')}
                    disabled={!selectedCustomer?.phone}
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    SMS
                  </Button>
                </div>

                {!selectedCustomer?.email && !selectedCustomer?.phone && (
                  <p className="text-xs text-gray-500">
                    Kunden saknar kontaktuppgifter för kvitto
                  </p>
                )}

                <Button
                  variant="outline"
                  className="w-full h-12"
                  onClick={() => router.push('/saljare')}
                >
                  Hoppa över
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Receipt sent — done */}
          {receiptSent && (
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--club-primary, #15803d) 15%, white)' }}>
                  <Check className="h-8 w-8" style={{ color: 'var(--club-primary, #15803d)' }} />
                </div>
                <p className="font-bold text-lg">
                  {receiptMethod === 'email' ? 'Kvitto skickat via e-post' : 'Kvitto skickat via SMS'}
                </p>
                <Button
                  className="w-full h-14 text-lg"
                  onClick={() => router.push('/saljare')}
                  style={{ backgroundColor: 'var(--club-primary, #15803d)' }}
                >
                  Klar!
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
