'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, X, Clock, DoorOpen, Eye } from 'lucide-react'

interface MarkVisitDialogProps {
  addressId: string
  addressLabel: string
  campaignId?: string
  trigger: React.ReactNode
  onVisitMarked?: (result: string) => void
}

const visitOptions = [
  {
    result: 'KOPT',
    label: 'Köpte!',
    icon: Check,
    color: '#16a34a',
    bgColor: '#dcfce7',
  },
  {
    result: 'NEJ_TACK',
    label: 'Nej tack',
    icon: X,
    color: '#6b7280',
    bgColor: '#f3f4f6',
  },
  {
    result: 'NEJ_TACK_FRAMTIDEN',
    label: 'Kanske senare',
    icon: Clock,
    color: '#ca8a04',
    bgColor: '#fef9c3',
  },
  {
    result: 'INGEN_HEMMA',
    label: 'Ingen hemma',
    icon: DoorOpen,
    color: '#ea580c',
    bgColor: '#ffedd5',
  },
  {
    result: 'EJ_BESIKT',
    label: 'Ej besökt',
    icon: Eye,
    color: '#9ca3af',
    bgColor: '#f9fafb',
  },
]

export function MarkVisitDialog({
  addressId,
  addressLabel,
  campaignId,
  trigger,
  onVisitMarked,
}: MarkVisitDialogProps) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(result: string) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/saljare/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId,
          result,
          notes: notes || undefined,
          campaignId: campaignId || undefined,
        }),
      })
      if (res.ok) {
        setDone(true)
        onVisitMarked?.(result)
        setTimeout(() => {
          setOpen(false)
          setDone(false)
          setNotes('')
        }, 1000)
      }
    } catch (error) {
      console.error('Error marking visit:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Notera besök</DialogTitle>
          <p className="text-sm text-gray-600">{addressLabel}</p>
        </DialogHeader>

        {done ? (
          <div className="py-8 text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3"
              style={{ backgroundColor: 'color-mix(in srgb, var(--club-primary, #15803d) 15%, white)' }}
            >
              <Check className="h-8 w-8" style={{ color: 'var(--club-primary, #15803d)' }} />
            </div>
            <p className="font-bold">Sparat!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              {visitOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.result}
                    onClick={() => handleSubmit(option.result)}
                    disabled={submitting}
                    className="w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                    style={{
                      borderColor: option.bgColor,
                      backgroundColor: option.bgColor,
                    }}
                  >
                    <Icon className="h-6 w-6 flex-shrink-0" style={{ color: option.color }} />
                    <span className="text-base font-medium" style={{ color: option.color }}>
                      {option.label}
                    </span>
                  </button>
                )
              })}
            </div>

            <div>
              <label className="text-xs text-gray-500">Anteckningar (valfritt)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="T.ex. ring tillbaka kl 18..."
                className="mt-1"
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
