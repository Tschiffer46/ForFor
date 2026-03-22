'use client'

import { useMemo, useState, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

// Serialized delivery data passed from server
export interface SerializedDelivery {
  id: string
  deliveryId: string
  deliveryStatus: 'EJ_HAMTAD' | 'HAMTAD' | 'EJ_LEVERERAD' | 'LEVERERAD' | 'MISSLYCKAD'
  deliveryNotes: string | null
  orderId: string
  address: string
  city: string
  customerName: string
  customerNumber: string
  phone: string | null
  products: string
  totalAmount: number
  orderStatus: 'OBETALD' | 'BETALD'
  teamName: string
}

const DELIVERY_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'EJ_HAMTAD', label: 'Ej hämtad' },
  { value: 'HAMTAD', label: 'Hämtad' },
  { value: 'LEVERERAD', label: 'Levererad' },
  { value: 'MISSLYCKAD', label: 'Misslyckad' },
]

function statusBadgeVariant(status: string): 'default' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'LEVERERAD': return 'success'
    case 'HAMTAD': return 'default'
    case 'MISSLYCKAD': return 'destructive'
    default: return 'warning'
  }
}

function statusLabel(status: string): string {
  return DELIVERY_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
}

function SortIcon({ column }: { column: { getIsSorted: () => false | 'asc' | 'desc' } }) {
  const sort = column.getIsSorted()
  if (sort === 'asc') return <ArrowUp className="ml-1 h-3 w-3 inline" />
  if (sort === 'desc') return <ArrowDown className="ml-1 h-3 w-3 inline" />
  return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />
}

interface DeliveryTableProps {
  deliveries: SerializedDelivery[]
  onStatusUpdate: (deliveryId: string, status: string) => Promise<void>
  onNotesUpdate: (deliveryId: string, notes: string) => Promise<void>
}

function StatusCell({
  row,
  onStatusUpdate,
}: {
  row: SerializedDelivery
  onStatusUpdate: (deliveryId: string, status: string) => Promise<void>
}) {
  const [updating, setUpdating] = useState(false)

  const handleChange = async (newStatus: string) => {
    setUpdating(true)
    try {
      await onStatusUpdate(row.deliveryId, newStatus)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <>
      {/* Print view: show badge */}
      <span className="hidden print:inline">
        <Badge variant={statusBadgeVariant(row.deliveryStatus)}>
          {statusLabel(row.deliveryStatus)}
        </Badge>
      </span>
      {/* Screen view: show dropdown */}
      <select
        value={row.deliveryStatus}
        onChange={(e) => handleChange(e.target.value)}
        disabled={updating}
        className="print:hidden h-8 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
      >
        {DELIVERY_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </>
  )
}

function NotesCell({
  row,
  onNotesUpdate,
}: {
  row: SerializedDelivery
  onNotesUpdate: (deliveryId: string, notes: string) => Promise<void>
}) {
  const [value, setValue] = useState(row.deliveryNotes ?? '')
  const [saving, setSaving] = useState(false)

  const handleBlur = async () => {
    const trimmed = value.trim()
    if (trimmed === (row.deliveryNotes ?? '')) return
    setSaving(true)
    try {
      await onNotesUpdate(row.deliveryId, trimmed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Print view */}
      <span className="hidden print:inline text-xs text-gray-600">
        {row.deliveryNotes || '-'}
      </span>
      {/* Screen view */}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="Kommentar..."
        disabled={saving}
        className="print:hidden h-8 w-full min-w-[120px] rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
      />
    </>
  )
}

export default function DeliveryTable({
  deliveries,
  onStatusUpdate,
  onNotesUpdate,
}: DeliveryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'address', desc: false },
  ])
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo<ColumnDef<SerializedDelivery>[]>(
    () => [
      {
        id: 'address',
        accessorKey: 'address',
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Adress <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-sm">{row.original.address}</p>
            <p className="text-xs text-gray-500">{row.original.city}</p>
          </div>
        ),
      },
      {
        accessorKey: 'customerName',
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Kund <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => (
          <div>
            <p className="text-sm">{row.original.customerName}</p>
            {row.original.phone && (
              <a
                href={`tel:${row.original.phone}`}
                className="text-xs text-blue-600 underline"
              >
                {row.original.phone}
              </a>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'customerNumber',
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Kundnr <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm">{row.original.customerNumber}</span>
        ),
        sortingFn: 'basic',
      },
      {
        accessorKey: 'products',
        header: 'Produkter',
        cell: ({ row }) => (
          <span className="text-xs whitespace-pre-line">{row.original.products}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'totalAmount',
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Belopp <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold whitespace-nowrap text-sm">
            {formatCurrency(row.original.totalAmount)}
          </span>
        ),
      },
      {
        accessorKey: 'orderStatus',
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Betalstatus <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.orderStatus === 'BETALD' ? 'success' : 'warning'}>
            {row.original.orderStatus === 'BETALD' ? 'Betald' : 'Obetald'}
          </Badge>
        ),
      },
      {
        accessorKey: 'deliveryStatus',
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Leveransstatus <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => (
          <StatusCell row={row.original} onStatusUpdate={onStatusUpdate} />
        ),
      },
      {
        id: 'notes',
        header: 'Kommentar',
        cell: ({ row }) => (
          <NotesCell row={row.original} onNotesUpdate={onNotesUpdate} />
        ),
        enableSorting: false,
      },
    ],
    [onStatusUpdate, onNotesUpdate]
  )

  const table = useReactTable({
    data: deliveries,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const search = filterValue.toLowerCase()
      const d = row.original
      return (
        d.address.toLowerCase().includes(search) ||
        d.city.toLowerCase().includes(search) ||
        d.customerName.toLowerCase().includes(search) ||
        d.customerNumber.toLowerCase().includes(search) ||
        d.products.toLowerCase().includes(search) ||
        d.teamName.toLowerCase().includes(search) ||
        (d.phone?.includes(search) ?? false) ||
        (d.deliveryNotes?.toLowerCase().includes(search) ?? false)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <>
      {/* Search */}
      <div className="print:hidden">
        <Input
          placeholder="Sök adress, kund, produkt..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs h-9 text-sm"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
                {table.getRowModel().rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      Inga leveranser matchar filtren
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 text-xs text-gray-500 border-t print:hidden">
            Visar {table.getRowModel().rows.length} av {deliveries.length} leveranser
          </div>
        </CardContent>
      </Card>
    </>
  )
}
