/**
 * Tests unitarios para el sistema de caché
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { cache, getCachedData, CACHE_KEYS } from '@/lib/cache'

describe('Sistema de Caché', () => {
  beforeEach(() => {
    // Limpiar caché antes de cada test
    cache.clear()
  })

  describe('cache.set y cache.get', () => {
    it('debe guardar y recuperar datos', () => {
      cache.set('test-key', { value: 'test-data' })
      const result = cache.get('test-key')
      expect(result).toEqual({ value: 'test-data' })
    })

    it('debe retornar null para claves inexistentes', () => {
      const result = cache.get('non-existent-key')
      expect(result).toBeNull()
    })

    it('debe respetar el TTL', async () => {
      cache.set('expiring-key', 'data', 100) // 100ms TTL
      
      // Inmediatamente debe existir
      expect(cache.get('expiring-key')).toBe('data')
      
      // Después del TTL debe expirar
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(cache.get('expiring-key')).toBeNull()
    })
  })

  describe('cache.delete', () => {
    it('debe eliminar una clave específica', () => {
      cache.set('key1', 'data1')
      cache.set('key2', 'data2')
      
      cache.delete('key1')
      
      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBe('data2')
    })
  })

  describe('cache.clear', () => {
    it('debe eliminar todas las claves', () => {
      cache.set('key1', 'data1')
      cache.set('key2', 'data2')
      
      cache.clear()
      
      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBeNull()
    })
  })

  describe('getCachedData', () => {
    it('debe ejecutar fetchFn si no hay caché', async () => {
      const fetchFn = vi.fn().mockResolvedValue('fetched-data')
      
      const result = await getCachedData('test-key', fetchFn, 1000)
      
      expect(result).toBe('fetched-data')
      expect(fetchFn).toHaveBeenCalledTimes(1)
    })

    it('debe retornar datos cacheados sin ejecutar fetchFn', async () => {
      const fetchFn = vi.fn().mockResolvedValue('fetched-data')
      
      // Primera llamada
      await getCachedData('test-key', fetchFn, 1000)
      // Segunda llamada
      const result = await getCachedData('test-key', fetchFn, 1000)
      
      expect(result).toBe('fetched-data')
      expect(fetchFn).toHaveBeenCalledTimes(1) // Solo una vez
    })
  })

  describe('CACHE_KEYS', () => {
    it('debe tener todas las claves definidas', () => {
      expect(CACHE_KEYS.MONTHLY_STATS).toBeDefined()
      expect(CACHE_KEYS.UPCOMING_ORDERS).toBeDefined()
      expect(CACHE_KEYS.LOW_STOCK).toBeDefined()
      expect(CACHE_KEYS.INVENTORY).toBeDefined()
      expect(CACHE_KEYS.ORDERS).toBeDefined()
      expect(CACHE_KEYS.PRODUCTS).toBeDefined()
      expect(CACHE_KEYS.RECIPES).toBeDefined()
      expect(CACHE_KEYS.INGREDIENTS).toBeDefined()
    })
  })
})

