'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface KeyPerson {
  id: string
  role: string
  name: string
  email: string | null
  phone: string | null
}

const ROLES = [
  { key: 'ordforande', label: 'Ordförande' },
  { key: 'forsaljningsansvarig', label: 'Försäljningsansvarig' },
  { key: 'nyckelperson_1', label: 'Nyckelperson 1' },
  { key: 'nyckelperson_2', label: 'Nyckelperson 2' },
  { key: 'nyckelperson_3', label: 'Nyckelperson 3' },
]

export function ClubKeyPersons({ slug, keyPersons }: { slug: string; keyPersons: KeyPerson[] }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Build form state from existing data
  const existingByRole = new Map(keyPersons.map((kp) => [kp.role, kp]))

  const [form, setForm] = useState(
    ROLES.map((r) => {
      const existing = existingByRole.get(r.key)
      return {
        role: r.key,
        label: r.label,
        name: existing?.name || '',
        email: existing?.email || '',
        phone: existing?.phone || '',
      }
    })
  )

  const handleChange = (index: number, field: string, value: string) => {
    const updated = [...form]
    updated[index] = { ...updated[index], [field]: value }
    setForm(updated)
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const keyPersonsData = form
        .filter((f) => f.name.trim() !== '')
        .map((f) => ({
          role: f.role,
          name: f.name,
          email: f.email || undefined,
          phone: f.phone || undefined,
        }))

      const res = await fetch(`/api/admin/klubbar/${slug}/key-persons`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyPersons: keyPersonsData }),
      })
      if (!res.ok) throw new Error('Failed')
      setDirty(false)
      router.refresh()
    } catch {
      alert('Ett fel uppstod')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {form.map((person, i) => (
          <div key={person.role} className="grid grid-cols-4 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">{person.label}</Label>
              <Input
                placeholder="Namn"
                value={person.name}
                onChange={(e) => handleChange(i, 'name', e.target.value)}
              />
            </div>
            <div>
              <Input
                placeholder="E-post"
                type="email"
                value={person.email}
                onChange={(e) => handleChange(i, 'email', e.target.value)}
              />
            </div>
            <div>
              <Input
                placeholder="Telefon"
                value={person.phone}
                onChange={(e) => handleChange(i, 'phone', e.target.value)}
              />
            </div>
            <div></div>
          </div>
        ))}
      </div>

      {dirty && (
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Sparar...' : 'Spara nyckelpersoner'}
        </Button>
      )}
    </div>
  )
}
