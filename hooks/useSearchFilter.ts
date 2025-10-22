/**
 * Hook para manejar búsqueda y filtros en listas
 * Proporciona estado y lógica de búsqueda/filtrado reutilizable
 */

import { useState, useCallback, useEffect } from 'react'
import { useDebounce } from './useDebounce'

interface UseSearchFilterOptions {
  initialSearch?: string
  initialFilters?: Record<string, any>
  debounceDelay?: number
  onSearchChange?: (search: string) => void
  onFiltersChange?: (filters: Record<string, any>) => void
}

interface UseSearchFilterResult {
  search: string
  debouncedSearch: string
  filters: Record<string, any>
  setSearch: (search: string) => void
  setFilter: (key: string, value: any) => void
  setFilters: (filters: Record<string, any>) => void
  clearSearch: () => void
  clearFilters: () => void
  clearAll: () => void
  isSearching: boolean
}

export function useSearchFilter(
  options: UseSearchFilterOptions = {}
): UseSearchFilterResult {
  const {
    initialSearch = '',
    initialFilters = {},
    debounceDelay = 300,
    onSearchChange,
    onFiltersChange
  } = options

  const [search, setSearch] = useState(initialSearch)
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters)
  const debouncedSearch = useDebounce(search, debounceDelay)
  const [isSearching, setIsSearching] = useState(false)

  // Detectar cuando está buscando
  useEffect(() => {
    if (search !== debouncedSearch) {
      setIsSearching(true)
    } else {
      setIsSearching(false)
    }
  }, [search, debouncedSearch])

  // Notificar cambios de búsqueda
  useEffect(() => {
    onSearchChange?.(debouncedSearch)
  }, [debouncedSearch, onSearchChange])

  // Notificar cambios de filtros
  useEffect(() => {
    onFiltersChange?.(filters)
  }, [filters, onFiltersChange])

  const setFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  const clearSearch = useCallback(() => {
    setSearch('')
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const clearAll = useCallback(() => {
    setSearch('')
    setFilters({})
  }, [])

  return {
    search,
    debouncedSearch,
    filters,
    setSearch,
    setFilter,
    setFilters,
    clearSearch,
    clearFilters,
    clearAll,
    isSearching
  }
}

