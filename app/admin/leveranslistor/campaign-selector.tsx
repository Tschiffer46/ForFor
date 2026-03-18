'use client'

import { useRouter, usePathname } from 'next/navigation'

interface CampaignOption {
  id: string
  name: string
  active: boolean
}

interface CampaignSelectorProps {
  campaigns: CampaignOption[]
  selectedId: string
}

export default function CampaignSelector({ campaigns, selectedId }: CampaignSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleChange = (campaignId: string) => {
    router.push(`${pathname}?kampanj=${campaignId}`)
  }

  return (
    <select
      value={selectedId}
      onChange={(e) => handleChange(e.target.value)}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
    >
      {campaigns.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}{c.active ? ' (aktiv)' : ''}
        </option>
      ))}
    </select>
  )
}
