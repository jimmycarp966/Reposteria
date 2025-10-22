/**
 * Tests para el hook useDebounce
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce, useDebouncedValue } from '@/hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('debe retornar el valor inicial inmediatamente', () => {
    const { result } = renderHook(() => useDebounce('initial', 300))
    expect(result.current).toBe('initial')
  })

  it('debe debounce del valor después del delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    )

    expect(result.current).toBe('initial')

    // Cambiar valor
    rerender({ value: 'updated' })
    expect(result.current).toBe('initial') // Todavía no cambia

    // Avanzar tiempo
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('updated') // Ahora sí cambia
  })

  it('debe resetear el timer en cambios rápidos', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'change1' })
    act(() => { vi.advanceTimersByTime(100) })
    
    rerender({ value: 'change2' })
    act(() => { vi.advanceTimersByTime(100) })
    
    rerender({ value: 'final' })
    act(() => { vi.advanceTimersByTime(300) })

    // Solo el último valor debe aplicarse
    expect(result.current).toBe('final')
  })
})

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('debe retornar valor y estado de debouncing', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 300))
    
    act(() => {
      vi.advanceTimersByTime(350)
    })
    
    const [value, isDebouncing] = result.current
    expect(value).toBe('initial')
    expect(isDebouncing).toBe(false)
  })

  it('debe indicar cuando está debouncing', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })
    
    const [, isDebouncing] = result.current
    expect(isDebouncing).toBe(true)

    act(() => {
      vi.advanceTimersByTime(300)
    })

    const [, isDebouncing2] = result.current
    expect(isDebouncing2).toBe(false)
  })
})

