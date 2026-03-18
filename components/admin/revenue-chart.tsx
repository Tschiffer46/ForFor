'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface MonthData {
  month: number
  soldNotOrdered: number
  other: number
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']

function formatSEK(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(value)
}

export function RevenueChart({ year }: { year?: number }) {
  const [data, setData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)
  const currentYear = year || new Date().getFullYear()

  useEffect(() => {
    fetch(`/api/admin/analytics/revenue?year=${currentYear}`)
      .then(res => res.json())
      .then(json => {
        setData(json.months || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [currentYear])

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-gray-400">Laddar diagram...</div>
  }

  const chartData = data.map(d => ({
    name: MONTH_NAMES[d.month - 1],
    'Sålt men ej beställt': d.soldNotOrdered,
    'Övrig försäljning': d.other,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(value) => formatSEK(Number(value))} />
        <Legend />
        <Bar dataKey="Sålt men ej beställt" fill="#f59e0b" stackId="a" />
        <Bar dataKey="Övrig försäljning" fill="#10b981" stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  )
}
