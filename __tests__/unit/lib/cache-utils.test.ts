/**
 * Tests para utilidades de cache
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { cache } from '@/lib/cache'
import {
  clearCacheByType,
  clearOrdersCache,
  clearInventoryCache,
  clearProductsCache,
  clearAllCache,
  clearRelevantCache
} from '@/lib/cache-utils'

// Mock del caché
vi.mock('@/lib/cache', () => ({
  cache: {
    delete: vi.fn(),
    clear: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    cleanup: vi.fn()
  },
  CACHE_KEYS: {
    MONTHLY_STATS: 'monthly_stats',
    UPCOMING_ORDERS: 'upcoming_orders',
    LOW_STOCK: 'low_stock',
    INVENTORY: 'inventory',
    ORDERS: 'orders',
    PRODUCTS: 'products',
    RECIPES: 'recipes',
    INGREDIENTS: 'ingredients',
  }
}))

describe('Cache Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('clearOrdersCache', () => {
    it('debe limpiar caché relacionado con pedidos', () => {
      clearOrdersCache()
      
      expect(cache.delete).toHaveBeenCalledWith('orders')
      expect(cache.delete).toHaveBeenCalledWith('upcoming_orders')
      expect(cache.delete).toHaveBeenCalledWith('monthly_stats')
    })
  })

  describe('clearInventoryCache', () => {
    it('debe limpiar caché relacionado con inventario', () => {
      clearInventoryCache()
      
      expect(cache.delete).toHaveBeenCalledWith('inventory')
      expect(cache.delete).toHaveBeenCalledWith('low_stock')
    })
  })

  describe('clearProductsCache', () => {
    it('debe limpiar caché relacionado con productos', () => {
      clearProductsCache()
      
      expect(cache.delete).toHaveBeenCalledWith('products')
      expect(cache.delete).toHaveBeenCalledWith('ingredients')
    })
  })

  describe('clearAllCache', () => {
    it('debe limpiar todo el caché', () => {
      clearAllCache()
      
      expect(cache.clear).toHaveBeenCalledTimes(1)
    })
  })

  describe('clearRelevantCache', () => {
    it('debe limpiar caché de pedidos cuando operation es order', () => {
      clearRelevantCache('order')
      
      expect(cache.delete).toHaveBeenCalledWith('orders')
      expect(cache.delete).toHaveBeenCalledWith('upcoming_orders')
      expect(cache.delete).toHaveBeenCalledWith('monthly_stats')
    })

    it('debe limpiar caché de inventario cuando operation es inventory', () => {
      clearRelevantCache('inventory')
      
      expect(cache.delete).toHaveBeenCalledWith('inventory')
      expect(cache.delete).toHaveBeenCalledWith('low_stock')
    })

    it('debe limpiar caché de productos cuando operation es product', () => {
      clearRelevantCache('product')
      
      expect(cache.delete).toHaveBeenCalledWith('products')
      expect(cache.delete).toHaveBeenCalledWith('ingredients')
    })

    it('debe limpiar productos e inventario cuando operation es ingredient', () => {
      clearRelevantCache('ingredient')
      
      expect(cache.delete).toHaveBeenCalledWith('products')
      expect(cache.delete).toHaveBeenCalledWith('ingredients')
      expect(cache.delete).toHaveBeenCalledWith('inventory')
      expect(cache.delete).toHaveBeenCalledWith('low_stock')
    })
  })
})

