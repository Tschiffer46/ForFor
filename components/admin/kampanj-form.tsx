'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface KampanjFormProps {
  trigger: React.ReactNode
  campaign?: {
    id: string
    name: string
    status: string
    salesStart: Date
    salesEnd: Date
    deliveryStart: Date | null
    deliveryEnd: Date | null
    preparationStart: Date | null
    preparationEnd: Date | null
    transportStart: Date | null
    transportEnd: Date | null
    recurring: boolean
    products: { productId: string }[]
    campaignTeams: { teamId: string }[]
  }
  products: { id: string; name: string }[]
  teams: { id: string; name: string; lagGroupName: string }[]
}

function toDateString(date: Date | null | undefined): string {
  if (!date) return ''
  return new Date(date).toISOString().split('T')[0]
}

export function KampanjForm({ trigger, campaign, products, teams }: KampanjFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    status: campaign?.status || 'DRAFT',
    salesStart: toDateString(campaign?.salesStart),
    salesEnd: toDateString(campaign?.salesEnd),
    deliveryStart: toDateString(campaign?.deliveryStart),
    deliveryEnd: toDateString(campaign?.deliveryEnd),
    preparationStart: toDateString(campaign?.preparationStart),
    preparationEnd: toDateString(campaign?.preparationEnd),
    transportStart: toDateString(campaign?.transportStart),
    transportEnd: toDateString(campaign?.transportEnd),
    recurring: campaign?.recurring ?? true,
  })

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    campaign?.products.map((p) => p.productId) || []
  )
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(
    campaign?.campaignTeams.map((ct) => ct.teamId) || []
  )

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = campaign
        ? `/api/admin/kampanjer/${campaign.id}`
        : '/api/admin/kampanjer'

      const method = campaign ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          productIds: selectedProductIds,
          teamIds: selectedTeamIds,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save campaign')
      }

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error saving campaign:', error)
      alert('Ett fel uppstod när kampanjen skulle sparas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {campaign ? 'Redigera kampanj' : 'Skapa ny kampanj'}
            </DialogTitle>
            <DialogDescription>
              Fyll i information om kampanjen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Namn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            {/* Status (only when editing) */}
            {campaign && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="DRAFT">Utkast</option>
                  <option value="ACTIVE">Aktiv</option>
                  <option value="CLOSED">Avslutad</option>
                </select>
              </div>
            )}

            {/* Förberedelseperiod */}
            <fieldset className="space-y-2 rounded-md border p-4">
              <legend className="px-2 text-sm font-medium">Förberedelseperiod</legend>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="preparationStart">Start</Label>
                  <Input
                    id="preparationStart"
                    type="date"
                    value={formData.preparationStart}
                    onChange={(e) =>
                      setFormData({ ...formData, preparationStart: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="preparationEnd">Slut</Label>
                  <Input
                    id="preparationEnd"
                    type="date"
                    value={formData.preparationEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, preparationEnd: e.target.value })
                    }
                  />
                </div>
              </div>
            </fieldset>

            {/* Försäljningsperiod */}
            <fieldset className="space-y-2 rounded-md border p-4">
              <legend className="px-2 text-sm font-medium">Försäljningsperiod *</legend>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="salesStart">Start *</Label>
                  <Input
                    id="salesStart"
                    type="date"
                    value={formData.salesStart}
                    onChange={(e) =>
                      setFormData({ ...formData, salesStart: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="salesEnd">Slut *</Label>
                  <Input
                    id="salesEnd"
                    type="date"
                    value={formData.salesEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, salesEnd: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </fieldset>

            {/* Transport */}
            <fieldset className="space-y-2 rounded-md border p-4">
              <legend className="px-2 text-sm font-medium">Transport</legend>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="transportStart">Start</Label>
                  <Input
                    id="transportStart"
                    type="date"
                    value={formData.transportStart}
                    onChange={(e) =>
                      setFormData({ ...formData, transportStart: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="transportEnd">Slut</Label>
                  <Input
                    id="transportEnd"
                    type="date"
                    value={formData.transportEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, transportEnd: e.target.value })
                    }
                  />
                </div>
              </div>
            </fieldset>

            {/* Utleveransperiod */}
            <fieldset className="space-y-2 rounded-md border p-4">
              <legend className="px-2 text-sm font-medium">Utleveransperiod</legend>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="deliveryStart">Start</Label>
                  <Input
                    id="deliveryStart"
                    type="date"
                    value={formData.deliveryStart}
                    onChange={(e) =>
                      setFormData({ ...formData, deliveryStart: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="deliveryEnd">Slut</Label>
                  <Input
                    id="deliveryEnd"
                    type="date"
                    value={formData.deliveryEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, deliveryEnd: e.target.value })
                    }
                  />
                </div>
              </div>
            </fieldset>

            {/* Recurring */}
            <div className="flex items-center gap-2">
              <input
                id="recurring"
                type="checkbox"
                checked={formData.recurring}
                onChange={(e) =>
                  setFormData({ ...formData, recurring: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="recurring">Återkommande kampanj</Label>
            </div>

            {/* Products multi-select */}
            {products.length > 0 && (
              <div className="space-y-2">
                <Label>Produkter</Label>
                <div className="max-h-40 overflow-y-auto rounded-md border p-3 space-y-2">
                  {products.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(product.id)}
                        onChange={() => toggleProduct(product.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm">{product.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Teams multi-select */}
            {teams.length > 0 && (
              <div className="space-y-2">
                <Label>Lag</Label>
                <div className="max-h-40 overflow-y-auto rounded-md border p-3 space-y-2">
                  {teams.map((team) => (
                    <label
                      key={team.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeamIds.includes(team.id)}
                        onChange={() => toggleTeam(team.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm">
                        {team.lagGroupName} &mdash; {team.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sparar...' : 'Spara'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
