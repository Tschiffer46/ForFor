import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export function SortIcon({
  column,
}: {
  column: { getIsSorted: () => false | 'asc' | 'desc' }
}) {
  const sort = column.getIsSorted()
  if (sort === 'asc') return <ArrowUp className="ml-1 h-3 w-3 inline" />
  if (sort === 'desc') return <ArrowDown className="ml-1 h-3 w-3 inline" />
  return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />
}
