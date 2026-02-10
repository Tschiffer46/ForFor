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

interface LagFormProps {
  trigger: React.ReactNode
  team?: {
    id: string
    namn: string
  }
}

export function LagForm({ trigger, team }: LagFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [namn, setNamn] = useState(team?.namn || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = team ? `/api/admin/lag/${team.id}` : '/api/admin/lag'
      const method = team ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namn }),
      })

      if (!response.ok) {
        throw new Error('Failed to save team')
      }

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error saving team:', error)
      alert('Ett fel uppstod när laget skulle sparas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {team ? 'Redigera lag' : 'Skapa nytt lag'}
            </DialogTitle>
            <DialogDescription>
              Ange namn för laget
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="namn">Lagnamn *</Label>
              <Input
                id="namn"
                value={namn}
                onChange={(e) => setNamn(e.target.value)}
                required
              />
            </div>
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
