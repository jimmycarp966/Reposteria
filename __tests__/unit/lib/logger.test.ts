/**
 * Tests para el sistema de logging
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logger } from '@/lib/logger'

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('métodos de logging', () => {
    it('debe tener todos los métodos principales', () => {
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.debug).toBe('function')
    })

    it('debe tener métodos helper', () => {
      expect(typeof logger.operationStart).toBe('function')
      expect(typeof logger.operationSuccess).toBe('function')
      expect(typeof logger.operationError).toBe('function')
      expect(typeof logger.performance).toBe('function')
    })
  })

  describe('logger.info', () => {
    it('debe aceptar mensaje y datos opcionales', () => {
      expect(() => {
        logger.info('Test message')
        logger.info('Test message', { key: 'value' })
        logger.info('Test message', { key: 'value' }, 'context')
      }).not.toThrow()
    })
  })

  describe('logger.error', () => {
    it('debe aceptar Error objects', () => {
      const error = new Error('Test error')
      expect(() => {
        logger.error('Error occurred', error, 'test-context')
      }).not.toThrow()
    })

    it('debe aceptar datos planos', () => {
      expect(() => {
        logger.error('Error occurred', { code: 500 }, 'test-context')
      }).not.toThrow()
    })
  })

  describe('helper methods', () => {
    it('operationStart debe funcionar', () => {
      expect(() => {
        logger.operationStart('createOrder', 'orderActions')
      }).not.toThrow()
    })

    it('operationSuccess debe funcionar', () => {
      expect(() => {
        logger.operationSuccess('createOrder', 'orderActions', { id: '123' })
      }).not.toThrow()
    })

    it('operationError debe funcionar', () => {
      const error = new Error('Operation failed')
      expect(() => {
        logger.operationError('createOrder', 'orderActions', error)
      }).not.toThrow()
    })

    it('performance debe funcionar', () => {
      expect(() => {
        logger.performance('createOrder', 150, 'orderActions')
      }).not.toThrow()
    })
  })
})

