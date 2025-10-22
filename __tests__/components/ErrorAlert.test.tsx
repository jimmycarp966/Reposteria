/**
 * Tests para el componente ErrorAlert
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorAlert } from '@/components/shared/ErrorAlert'

describe('ErrorAlert Component', () => {
  it('debe renderizar mensaje de error', () => {
    render(<ErrorAlert message="Error de prueba" />)
    
    expect(screen.getByText('Error de prueba')).toBeInTheDocument()
  })

  it('debe mostrar título personalizado', () => {
    render(<ErrorAlert message="Test" title="Error Crítico" />)
    
    expect(screen.getByText('Error Crítico')).toBeInTheDocument()
  })

  it('debe mostrar título por defecto si no se proporciona', () => {
    render(<ErrorAlert message="Test" />)
    
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('debe llamar onDismiss cuando se hace clic en X', () => {
    const handleDismiss = vi.fn()
    
    render(<ErrorAlert message="Test" onDismiss={handleDismiss} />)
    
    const dismissButton = screen.getByRole('button')
    fireEvent.click(dismissButton)
    
    expect(handleDismiss).toHaveBeenCalledTimes(1)
  })

  it('no debe mostrar botón de cerrar si no hay onDismiss', () => {
    render(<ErrorAlert message="Test" />)
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('debe aplicar className personalizado', () => {
    const { container } = render(
      <ErrorAlert message="Test" className="custom-class" />
    )
    
    const alertDiv = container.firstChild
    expect(alertDiv).toHaveClass('custom-class')
  })

  it('debe mostrar icono de alerta', () => {
    const { container } = render(<ErrorAlert message="Test" />)
    
    // Verificar que existe un SVG (el icono)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})

