'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'

interface Address {
  id: string
  gatuadress: string
  postnummer: string
  stad: string
  gata: {
    namn: string
    stad: string
  }
}

interface Customer {
  id: string
  namn: string
  telefon?: string
  epost?: string
  prenumeration: boolean
}

interface Product {
  id: string
  namn: string
  beskrivning?: string
  pris: number
}

interface OrderItem {
  produktId: string
  antal: number
}

type Step = 'address' | 'customer' | 'products' | 'confirm'

export default function NyBestallningPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('address')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Data
  const [addresses, setAddresses] = useState<Address[]>([])
  const [products, setProducts] = useState<Product[]>([])
  
  // Selection
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  
  // New customer form
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [newCustomerSubscription, setNewCustomerSubscription] = useState(false)

  // Load addresses and products
  useEffect(() => {
    const loadData = async () => {
      try {
        const [addressesRes, productsRes] = await Promise.all([
          fetch('/api/saljare/addresses'),
          fetch('/api/saljare/products'),
        ])
        
        if (addressesRes.ok) {
          const data = await addressesRes.json()
          setAddresses(data.addresses)
        }
        
        if (productsRes.ok) {
          const data = await productsRes.json()
          setProducts(data.products)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  // Load customers for selected address
  useEffect(() => {
    if (selectedAddress) {
      const loadCustomers = async () => {
        const res = await fetch(`/api/saljare/customers?addressId=${selectedAddress.id}`)
        if (res.ok) {
          const data = await res.json()
          setCustomers(data.customers)
        }
      }
      loadCustomers()
    }
  }, [selectedAddress])

  const handleSelectAddress = (address: Address) => {
    setSelectedAddress(address)
    setStep('customer')
  }

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setStep('products')
  }

  const handleCreateCustomer = async () => {
    if (!newCustomerName || !selectedAddress) return

    try {
      const res = await fetch('/api/saljare/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namn: newCustomerName,
          telefon: newCustomerPhone || undefined,
          epost: newCustomerEmail || undefined,
          prenumeration: newCustomerSubscription,
          adressId: selectedAddress.id,
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

  const updateQuantity = (produktId: string, antal: number) => {
    if (antal <= 0) {
      setOrderItems(items => items.filter(item => item.produktId !== produktId))
    } else {
      setOrderItems(items => {
        const existing = items.find(item => item.produktId === produktId)
        if (existing) {
          return items.map(item =>
            item.produktId === produktId ? { ...item, antal } : item
          )
        } else {
          return [...items, { produktId, antal }]
        }
      })
    }
  }

  const calculateTotal = () => {
    let total = 0
    orderItems.forEach(item => {
      const product = products.find(p => p.id === item.produktId)
      if (product) {
        total += product.pris * item.antal
      }
    })
    
    // Apply 10% discount if customer has subscription
    if (selectedCustomer?.prenumeration) {
      total = total * 0.9
    }
    
    return Math.round(total)
  }

  const handleSubmitOrder = async () => {
    if (!selectedCustomer || orderItems.length === 0) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/saljare/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kundId: selectedCustomer.id,
          items: orderItems,
        }),
      })

      if (res.ok) {
        router.push('/säljare/bestallningar')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-gray-500">Laddar...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {step !== 'address' && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (step === 'customer') setStep('address')
              else if (step === 'products') setStep('customer')
              else if (step === 'confirm') setStep('products')
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold">Ny beställning</h1>
          <p className="text-sm text-gray-600">
            {step === 'address' && 'Steg 1: Välj adress'}
            {step === 'customer' && 'Steg 2: Välj kund'}
            {step === 'products' && 'Steg 3: Välj produkter'}
            {step === 'confirm' && 'Steg 4: Bekräfta'}
          </p>
        </div>
      </div>

      {/* Step 1: Select Address */}
      {step === 'address' && (
        <div className="space-y-3">
          {addresses.map(address => (
            <Card
              key={address.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleSelectAddress(address)}
            >
              <CardContent className="p-4">
                <p className="font-bold">{address.gatuadress}</p>
                <p className="text-sm text-gray-600">
                  {address.gata.namn}, {address.postnummer} {address.stad}
                </p>
              </CardContent>
            </Card>
          ))}
          {addresses.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Inga adresser tillgängliga
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 2: Select or Create Customer */}
      {step === 'customer' && (
        <div className="space-y-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm">
                <span className="font-bold">Adress:</span> {selectedAddress?.gatuadress}
              </p>
            </CardContent>
          </Card>

          {!showNewCustomerForm ? (
            <>
              <div className="space-y-3">
                {customers.map(customer => (
                  <Card
                    key={customer.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold">{customer.namn}</p>
                          {customer.telefon && (
                            <p className="text-sm text-gray-600">{customer.telefon}</p>
                          )}
                        </div>
                        {customer.prenumeration && (
                          <Badge variant="success" className="text-xs">10% rabatt</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full h-12"
                onClick={() => setShowNewCustomerForm(true)}
              >
                + Ny kund
              </Button>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skapa ny kund</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Namn *</label>
                  <Input
                    value={newCustomerName}
                    onChange={e => setNewCustomerName(e.target.value)}
                    placeholder="Kundens namn"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Telefon</label>
                  <Input
                    value={newCustomerPhone}
                    onChange={e => setNewCustomerPhone(e.target.value)}
                    placeholder="070-1234567"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">E-post</label>
                  <Input
                    type="email"
                    value={newCustomerEmail}
                    onChange={e => setNewCustomerEmail(e.target.value)}
                    placeholder="kund@exempel.se"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="subscription"
                    checked={newCustomerSubscription}
                    onChange={e => setNewCustomerSubscription(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <label htmlFor="subscription" className="text-sm font-medium">
                    Prenumeration (10% rabatt)
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowNewCustomerForm(false)}
                  >
                    Avbryt
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCreateCustomer}
                    disabled={!newCustomerName}
                  >
                    Skapa
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 3: Select Products */}
      {step === 'products' && (
        <div className="space-y-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 space-y-1">
              <p className="text-sm">
                <span className="font-bold">Kund:</span> {selectedCustomer?.namn}
              </p>
              {selectedCustomer?.prenumeration && (
                <Badge variant="success" className="text-xs">
                  10% rabatt tillämpas
                </Badge>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            {products.map(product => {
              const item = orderItems.find(i => i.produktId === product.id)
              const quantity = item?.antal || 0

              return (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold">{product.namn}</p>
                        {product.beskrivning && (
                          <p className="text-sm text-gray-600">{product.beskrivning}</p>
                        )}
                        <p className="text-lg font-bold text-green-700 mt-1">
                          {product.pris} kr
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        disabled={quantity === 0}
                      >
                        -
                      </Button>
                      <span className="text-2xl font-bold min-w-[3ch] text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total:</span>
                <span className="font-bold text-2xl text-green-700">
                  {calculateTotal()} kr
                </span>
              </div>
              {selectedCustomer?.prenumeration && (
                <p className="text-xs text-green-600 mt-1">
                  Inkluderar 10% prenumerationsrabatt
                </p>
              )}
            </CardContent>
          </Card>

          <Button
            className="w-full h-14 text-lg"
            onClick={() => setStep('confirm')}
            disabled={orderItems.length === 0}
          >
            Fortsätt till bekräftelse
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bekräfta beställning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Kund</p>
                <p className="font-bold">{selectedCustomer?.namn}</p>
                {selectedCustomer?.telefon && (
                  <p className="text-sm">{selectedCustomer.telefon}</p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600">Adress</p>
                <p className="font-bold">{selectedAddress?.gatuadress}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Produkter</p>
                {orderItems.map(item => {
                  const product = products.find(p => p.id === item.produktId)
                  return (
                    <div key={item.produktId} className="flex justify-between">
                      <span>{item.antal}x {product?.namn}</span>
                      <span className="font-medium">
                        {product && item.antal * product.pris} kr
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="pt-3 border-t">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-green-700">{calculateTotal()} kr</span>
                </div>
                {selectedCustomer?.prenumeration && (
                  <p className="text-xs text-green-600 mt-1 text-right">
                    Inkl. 10% rabatt
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full h-14 text-lg"
            onClick={handleSubmitOrder}
            disabled={submitting}
          >
            {submitting ? (
              'Skapar beställning...'
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" />
                Skapa beställning
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
