"use client"

/**
 * Componente reutilizable para búsqueda y filtros
 */

import { Search, X, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface FilterOption {
  label: string
  key: string
  options: { value: string; label: string }[]
}

interface SearchFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  onClearSearch: () => void
  filterOptions?: FilterOption[]
  activeFilters?: Record<string, string>
  onFilterChange?: (key: string, value: string) => void
  onClearFilters?: () => void
  placeholder?: string
  showFilterCount?: boolean
  isSearching?: boolean
}

export function SearchFilter({
  searchValue,
  onSearchChange,
  onClearSearch,
  filterOptions = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  placeholder = 'Buscar...',
  showFilterCount = true,
  isSearching = false
}: SearchFilterProps) {
  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length
  const hasSearch = searchValue.length > 0

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-10"
          />
          {hasSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {isSearching && (
            <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
              <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Filtros */}
        {filterOptions.length > 0 && (
          <>
            {filterOptions.map((filter) => (
              <Select
                key={filter.key}
                value={activeFilters[filter.key] || '__ALL__'}
                onValueChange={(value) => onFilterChange?.(filter.key, value === '__ALL__' ? '' : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder={filter.label} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ALL__">Todos</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}

            {/* Botón limpiar filtros */}
            {(activeFilterCount > 0 || hasSearch) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClearSearch()
                  onClearFilters?.()
                }}
                className="ml-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar {activeFilterCount > 0 && `(${activeFilterCount + (hasSearch ? 1 : 0)})`}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Badges de filtros activos */}
      {showFilterCount && (activeFilterCount > 0 || hasSearch) && (
        <div className="flex flex-wrap gap-2">
          {hasSearch && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Búsqueda: "{searchValue}"
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSearch}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filterOptions.map((filter) => {
            const value = activeFilters[filter.key]
            if (!value) return null

            const option = filter.options.find(o => o.value === value)
            if (!option) return null

            return (
              <Badge key={filter.key} variant="secondary" className="flex items-center gap-1">
                {filter.label}: {option.label}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFilterChange?.(filter.key, '')}
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}

