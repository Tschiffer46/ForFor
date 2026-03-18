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

  // New customer/address form
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [newAddressStreet, setNewAddressStreet] = useState('')
  const [newAddressPostalCode, setNewAddressPostalCode] = useState('')
  const [newAddressCity, setNewAddressCity] = useState('')
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
  const [showContactForm, setShowContactForm] = useState(false)
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')

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

  async function createCustomerWithAddress() {
    if (!newCustomerName.trim() || !newAddressStreet.trim()) return
    try {
      const res = await fetch('/api/saljare/customers/with-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newCustomerName.trim(),
          phone: newCustomerPhone || undefined,
          email: newCustomerEmail || undefined,
          streetAddress: newAddressStreet.trim(),
          postalCode: newAddressPostalCode || undefined,
          city: newAddressCity || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedCustomer(data)
        setSelectedAddress(data.address)
        setShowNewAddressForm(false)
        setStep('products')
      }
    } catch (error) {
      console.error('Error creating customer with address:', error)
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
    } else if (step === 'identify' && (showNewCustomerForm || showNewAddressForm || selectedAddress)) {
      setShowNewCustomerForm(false)
      setShowNewAddressForm(false)
      setSelectedAddress(null)
      setSelectedCustomer(null)
    }
  }

  // ─── Render ────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        {(step !== 'identify' || selectedAddress || showNewAddressForm) && step !== 'payment' && (
          <Button variant="outline" size="icon" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-xl font-bold">Ny beställning</h1>
          <p className="text-xs text-gray-600">
            {step === 'identify' && 'Hitta kund'}
            {step === 'products' && 'Välj produkter'}
            {step === 'payment' && 'Betalning'}
          </p>
        </div>
      </div>

      {/* ─── STEP 1: Identify Customer ─── */}
      {step === 'identify' && !selectedAddress && !showNewAddressForm && (
        <>
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök gatunamn..."
              className="h-12 text-base pl-10"
              autoFocus
            />
          </div>

          {/* Search results — compact list */}
          {searching && <p className="text-center text-gray-500 py-3 text-sm">Söker...</p>}

          {!searching && addresses.length > 0 && (
            <div className="space-y-1">
              {addresses.map((address) => (
                <button
                  key={address.id}
                  className="w-full text-left p-3 rounded-lg border bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  onClick={() => selectAddress(address)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{address.street}</p>
                      <p className="text-xs text-gray-500">{address.postalCode} {address.city}</p>
                    </div>
                    {address.customers.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {address.customers.length} kund{address.customers.length > 1 ? 'er' : ''}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results — offer to create new address */}
          {!searching && hasSearched && addresses.length === 0 && (
            <div className="space-y-3">
              <div className="py-4 text-center">
                <p className="text-gray-500 text-sm">Ingen adress hittades för &quot;{searchQuery}&quot;</p>
              </div>
              <Button
                className="w-full h-12"
                onClick={() => {
                  setNewAddressStreet(searchQuery)
                  setShowNewAddressForm(true)
                }}
                style={{ backgroundColor: 'var(--club-primary, #15803d)' }}
              >
                + Lägg till ny adress och kund
              </Button>
            </div>
          )}
        </>
      )}

      {/* New address + customer form (when address not found) */}
      {step === 'identify' && showNewAddressForm && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ny adress och kund</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Gatuadress *</label>
              <Input
                value={newAddressStreet}
                onChange={(e) => setNewAddressStreet(e.target.value)}
                placeholder="T.ex. Kyrkogatan 5"
                className="h-10"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-600">Postnummer</label>
                <Input
                  value={newAddressPostalCode}
                  onChange={(e) => setNewAddressPostalCode(e.target.value)}
                  placeholder="123 45"
                  className="h-10"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Ort</label>
                <Input
                  value={newAddressCity}
                  onChange={(e) => setNewAddressCity(e.target.value)}
                  placeholder="Ort"
                  className="h-10"
                />
              </div>
            </div>
            <hr />
            <div>
              <label className="text-xs font-medium text-gray-600">Kundnamn *</label>
              <Input
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Kundens namn"
                className="h-10"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Telefon</label>
              <Input
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="070-1234567"
                className="h-10"
                type="tel"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">E-post</label>
              <Input
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                placeholder="kund@exempel.se"
                className="h-10"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 h-10"
                onClick={() => setShowNewAddressForm(false)}
              >
                Avbryt
              </Button>
              <Button
                className="flex-1 h-10"
                onClick={createCustomerWithAddress}
                disabled={!newCustomerName.trim() || !newAddressStreet.trim()}
                style={{ backgroundColor: 'var(--club-primary, #15803d)' }}
              >
                Skapa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Address selected — show customers or new customer form */}
      {step === 'identify' && selectedAddress && !showNewCustomerForm && (
        <div className="space-y-2">
          <div
            className="p-2 rounded-lg border text-xs"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--club-primary, #15803d) 5%, white)',
              borderColor: 'color-mix(in srgb, var(--club-primary, #15803d) 20%, white)',
            }}
          >
            <span className="font-medium">{selectedAddress.street}</span>
            <span className="text-gray-500 ml-2">{selectedAddress.postalCode} {selectedAddress.city}</span>
          </div>

          {selectedAddress.customers.length > 0 && (
            <>
              <p className="text-xs font-medium text-gray-500">Kunder på denna adress:</p>
              {selectedAddress.customers.map((customer) => (
                <button
                  key={customer.id}
                  className="w-full text-left p-3 rounded-lg border bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  onClick={() => selectCustomer(customer)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{customer.name}</p>
                      {customer.phone && (
                        <p className="text-xs text-gray-500">{customer.phone}</p>
                      )}
                    </div>
                    {customer.subscription && (
                      <Badge variant="success" className="text-xs">10% rabatt</Badge>
                    )}
                  </div>
                  {customer.orders.length > 0 && (
                    <div className="mt-1.5 pt-1.5 border-t">
                      <p className="text-xs text-gray-400 mb-0.5">Senaste:</p>
                      {customer.orders.slice(0, 2).map((order) => (
                        <div key={order.id} className="flex justify-between text-xs text-gray-500">
                          <span className="truncate mr-2">
                            {order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ')}
                          </span>
                          <span className="font-medium flex-shrink-0">{order.totalAmount} kr</span>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </>
          )}

          <Button
            variant="outline"
            className="w-full h-10 text-sm"
            onClick={() => setShowNewCustomerForm(true)}
          >
            + Ny kund
          </Button>
        </div>
      )}

      {/* New customer form (on existing address) */}
      {step === 'identify' && showNewCustomerForm && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ny kund</CardTitle>
            {selectedAddress && (
              <p className="text-xs text-gray-600">{selectedAddress.street}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Namn *</label>
              <Input
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Kundens namn"
                className="h-10"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Telefon</label>
              <Input
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="070-1234567"
                className="h-10"
                type="tel"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">E-post</label>
              <Input
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                placeholder="kund@exempel.se"
                className="h-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-10"
                onClick={() => setShowNewCustomerForm(false)}
              >
                Avbryt
              </Button>
              <Button
                className="flex-1 h-10"
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
          <div
            className="p-2 rounded-lg border text-xs flex items-center justify-between"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--club-primary, #15803d) 5%, white)',
              borderColor: 'color-mix(in srgb, var(--club-primary, #15803d) 20%, white)',
            }}
          >
            <div>
              <span className="font-medium">{selectedCustomer?.name}</span>
              <span className="text-gray-500 ml-2">{selectedAddress?.street}</span>
            </div>
            {selectedCustomer?.subscription && (
              <Badge variant="success" className="text-xs">10%</Badge>
            )}
          </div>

          {loadingProducts ? (
            <p className="text-center text-gray-500 py-8 text-sm">Laddar produkter...</p>
          ) : (
            <div className="space-y-2 pb-44">
              {products.map((product) => {
                const item = orderItems.find((i) => i.productId === product.id)
                const quantity = item?.quantity || 0

                return (
                  <div key={product.id} className="p-3 rounded-lg border bg-white">
                    <div className="flex items-center gap-3">
                      {/* Product image */}
                      {product.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/uploads/${product.images[0].imagePath}`}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="font-bold text-sm ml-2 flex-shrink-0" style={{ color: 'var(--club-primary, #15803d)' }}>
                            {product.price} kr
                          </p>
                        </div>
                        {product.size && (
                          <p className="text-xs text-gray-400">{product.size}</p>
                        )}
                      </div>
                    </div>

                    {/* Quantity controls — inline */}
                    <div className="flex items-center justify-end gap-3 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        disabled={quantity === 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-lg font-bold min-w-[2ch] text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Sticky total bar — compact */}
          {orderItems.length > 0 && (
            <div className="fixed bottom-20 left-0 right-0 bg-white border-t shadow-lg p-3 z-10">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-bold">Total: </span>
                    {selectedCustomer?.subscription && (
                      <span className="text-xs text-gray-500">(inkl. 10% rabatt)</span>
                    )}
                  </div>
                  <span className="font-bold text-xl" style={{ color: 'var(--club-primary, #15803d)' }}>
                    {calculateTotal()} kr
                  </span>
                </div>
                <Button
                  className="w-full h-12 text-base"
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
          {!paymentAction && !showContactForm && (
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
                className="w-full h-16 text-xl font-bold"
                onClick={markAsPaid}
                style={{ backgroundColor: 'var(--club-primary, #15803d)' }}
              >
                <Check className="mr-2 h-6 w-6" />
                Kunden har betalat
              </Button>

              <button
                className="w-full text-sm text-gray-400 underline py-2"
                onClick={() => {
                  // Check if customer has contact info for invoice
                  if (!selectedCustomer?.email && !selectedCustomer?.phone) {
                    setEditEmail('')
                    setEditPhone('')
                    setShowContactForm(true)
                  } else {
                    setPaymentAction('later')
                  }
                }}
              >
                Betala senare (faktura)
              </button>
            </>
          )}

          {/* Contact info needed for pay-later */}
          {showContactForm && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="font-bold text-base">Kontaktuppgifter krävs för faktura</p>
                <p className="text-sm text-gray-600">
                  Fyll i e-post eller telefon så att fakturan kan skickas.
                </p>
                <div>
                  <label className="text-xs font-medium text-gray-600">E-post</label>
                  <Input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="kund@exempel.se"
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Telefon</label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="070-1234567"
                    className="h-10"
                    type="tel"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1 h-10"
                    onClick={() => setShowContactForm(false)}
                  >
                    Tillbaka
                  </Button>
                  <Button
                    className="flex-1 h-10"
                    disabled={!editEmail.trim() && !editPhone.trim()}
                    onClick={async () => {
                      // Save contact info to backend and update local state
                      if (selectedCustomer) {
                        const updates: Record<string, string> = { id: selectedCustomer.id }
                        if (editEmail.trim()) updates.email = editEmail.trim()
                        if (editPhone.trim()) updates.phone = editPhone.trim()
                        try {
                          await fetch('/api/saljare/customers', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updates),
                          })
                        } catch (e) {
                          console.error('Failed to save contact info:', e)
                        }
                        setSelectedCustomer({
                          ...selectedCustomer,
                          email: editEmail.trim() || selectedCustomer.email,
                          phone: editPhone.trim() || selectedCustomer.phone,
                        })
                      }
                      setShowContactForm(false)
                      setPaymentAction('later')
                    }}
                    style={{ backgroundColor: 'var(--club-primary, #15803d)' }}
                  >
                    Fortsätt
                  </Button>
                </div>
              </CardContent>
            </Card>
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
