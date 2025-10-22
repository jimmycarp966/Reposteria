/**
 * Sistema de caché simple para mejorar rendimiento
 * En desarrollo, el caché se limpia automáticamente
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos por defecto

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // Verificar si el item ha expirado
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Limpiar items expirados
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Instancia global del caché
export const cache = new SimpleCache()

// Limpiar caché automáticamente cada 10 minutos
if (typeof window === 'undefined') {
  setInterval(() => {
    cache.cleanup()
  }, 10 * 60 * 1000)
}

/**
 * Función helper para obtener datos con caché
 */
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Intentar obtener del caché primero
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Si no está en caché, obtener los datos
  const data = await fetchFn()
  
  // Guardar en caché
  cache.set(key, data, ttl)
  
  return data
}

/**
 * Claves de caché para diferentes tipos de datos
 */
export const CACHE_KEYS = {
  MONTHLY_STATS: 'monthly_stats',
  UPCOMING_ORDERS: 'upcoming_orders',
  LOW_STOCK: 'low_stock',
  INVENTORY: 'inventory',
  ORDERS: 'orders',
  PRODUCTS: 'products',
  RECIPES: 'recipes',
  INGREDIENTS: 'ingredients',
} as const
