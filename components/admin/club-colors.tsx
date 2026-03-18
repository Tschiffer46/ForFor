'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface ClubColorsProps {
  slug: string
  color1: string | null
  color2: string | null
  color3: string | null
  color4: string | null
}

export function ClubColors({ slug, color1, color2, color3, color4 }: ClubColorsProps) {
  const router = useRouter()
  const [colors, setColors] = useState({
    color1: color1 || '#000000',
    color2: color2 || '#ffffff',
    color3: color3 || '#cccccc',
    color4: color4 || '#666666',
  })
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const handleChange = (key: string, value: string) => {
    setColors({ ...colors, [key]: value })
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/klubbar/${slug}/colors`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(colors),
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

  const colorFields = [
    { key: 'color1', label: 'Primärfärg' },
    { key: 'color2', label: 'Sekundärfärg' },
    { key: 'color3', label: 'Färg 3' },
    { key: 'color4', label: 'Färg 4' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {colorFields.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colors[key as keyof typeof colors]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border"
              />
              <span className="text-xs text-gray-500 font-mono">{colors[key as keyof typeof colors]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="flex gap-2">
        {Object.values(colors).map((c, i) => (
          <div key={i} className="w-12 h-12 rounded-lg shadow-sm" style={{ backgroundColor: c }} />
        ))}
      </div>

      {dirty && (
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Sparar...' : 'Spara färger'}
        </Button>
      )}
    </div>
  )
}
