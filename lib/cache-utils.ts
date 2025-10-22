/**
 * Utilidades para manejar el caché del sistema
 */

import { cache, CACHE_KEYS } from './cache'

/**
 * Limpiar caché específico por tipo de datos
 */
export function clearCacheByType(type: keyof typeof CACHE_KEYS): void {
  cache.delete(CACHE_KEYS[type])
}

/**
 * Limpiar caché relacionado con pedidos
 */
export function clearOrdersCache(): void {
  clearCacheByType('ORDERS')
  clearCacheByType('UPCOMING_ORDERS')
  clearCacheByType('MONTHLY_STATS')
}

/**
 * Limpiar caché relacionado con inventario
 */
export function clearInventoryCache(): void {
  clearCacheByType('INVENTORY')
  clearCacheByType('LOW_STOCK')
}

/**
 * Limpiar caché relacionado con productos
 */
export function clearProductsCache(): void {
  clearCacheByType('PRODUCTS')
  clearCacheByType('INGREDIENTS')
}

/**
 * Limpiar todo el caché
 */
export function clearAllCache(): void {
  cache.clear()
}

/**
 * Limpiar caché después de operaciones que modifican datos
 */
export function clearRelevantCache(operation: 'order' | 'inventory' | 'product' | 'ingredient'): void {
  switch (operation) {
    case 'order':
      clearOrdersCache()
      break
    case 'inventory':
      clearInventoryCache()
      break
    case 'product':
      clearProductsCache()
      break
    case 'ingredient':
      clearProductsCache()
      clearInventoryCache()
      break
  }
}
