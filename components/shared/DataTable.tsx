"use client"

/**
 * Componente de tabla genérica y reutilizable
 * Soporta paginación, sorting, vista móvil con cards, y estados vacíos
 */

import { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react'
import type { Column } from '@/lib/types'

interface PaginationConfig {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

interface DataTableProps<T extends { id: string }> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
  emptyState?: ReactNode
  mobileCardRender?: (row: T) => ReactNode
  pagination?: PaginationConfig
  onSort?: (key: string) => void
  currentSortKey?: string
  currentSortOrder?: 'asc' | 'desc'
  isLoading?: boolean
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  emptyState,
  mobileCardRender,
  pagination,
  onSort,
  currentSortKey,
  currentSortOrder,
  isLoading = false
}: DataTableProps<T>) {
  // Calcular páginas
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1
  const hasNextPage = pagination ? pagination.page < totalPages : false
  const hasPrevPage = pagination ? pagination.page > 1 : false

  // Estado vacío
  if (!isLoading && data.length === 0) {
    return emptyState ? <>{emptyState}</> : (
      <div className="text-center py-12 text-muted-foreground">
        No hay datos para mostrar
      </div>
    )
  }

  // Estado de carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-muted-foreground">Cargando...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden lg:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.sortable && onSort ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSort(column.key)}
                      className="-ml-3 h-8"
                    >
                      {column.header}
                      <ArrowUpDown
                        className={`ml-2 h-4 w-4 ${
                          currentSortKey === column.key
                            ? 'text-blue-600'
                            : 'text-gray-400'
                        }`}
                      />
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.cell?.(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.map((row) =>
          mobileCardRender ? (
            <div key={row.id}>{mobileCardRender(row)}</div>
          ) : (
            // Fallback: renderizar como lista simple
            <div
              key={row.id}
              className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              onClick={() => onRowClick?.(row)}
            >
              {columns.slice(0, 3).map((column) => (
                <div key={column.key} className="mb-2">
                  <span className="text-sm text-muted-foreground">
                    {column.header}:
                  </span>{' '}
                  <span className="text-sm font-medium">{column.cell?.(row)}</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Paginación */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Mostrando {(pagination.page - 1) * pagination.pageSize + 1} a{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} de{' '}
            {pagination.total} resultados
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(1)}
              disabled={!hasPrevPage}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={!hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-sm">
              Página {pagination.page} de {totalPages}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={!hasNextPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(totalPages)}
              disabled={!hasNextPage}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

