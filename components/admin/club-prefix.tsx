'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

interface ClubPrefixProps {
  slug: string
  prefix: string | null
}

export function ClubPrefix({ slug, prefix: initialPrefix }: ClubPrefixProps) {
  const router = useRouter()
  const [prefix, setPrefix] = useState(initialPrefix || '')
  const [saving, setSaving] = useState(false)
  const isDirty = prefix !== (initialPrefix || '')

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/klubbar/${slug}/prefix`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: prefix.toUpperCase() }),
      })
      if (res.ok) router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-sm w-24">Kundprefix</span>
      <Input
        value={prefix}
        onChange={(e) => setPrefix(e.target.value.toUpperCase())}
        placeholder="T.ex. UIF"
        className="h-8 w-24 text-sm uppercase"
        maxLength={10}
      />
      {isDirty && (
        <Button size="sm" variant="ghost" onClick={handleSave} disabled={saving}>
          <Check className="h-4 w-4" />
        </Button>
      )}
      <span className="text-xs text-gray-400">
        Används i kundnummer, t.ex. {prefix || 'XXX'}-10001
      </span>
    </div>
  )
}
