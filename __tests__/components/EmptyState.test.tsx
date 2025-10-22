/**
 * Tests para el componente EmptyState
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyState } from '@/components/shared/EmptyState'
import { Package } from 'lucide-react'

describe('EmptyState Component', () => {
  it('debe renderizar título y descripción', () => {
    render(
      <EmptyState
        icon={Package}
        title="No hay datos"
        description="Crea tu primer elemento"
      />
    )
    
    expect(screen.getByText('No hay datos')).toBeInTheDocument()
    expect(screen.getByText('Crea tu primer elemento')).toBeInTheDocument()
  })

  it('debe renderizar icono', () => {
    const { container } = render(
      <EmptyState
        icon={Package}
        title="Test"
        description="Test description"
      />
    )
    
    // Verificar que existe un SVG (el icono)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('debe renderizar botón de acción si se proporciona', () => {
    const handleAction = vi.fn()
    
    render(
      <EmptyState
        icon={Package}
        title="Test"
        description="Test description"
        action={{
          label: 'Crear Elemento',
          onClick: handleAction
        }}
      />
    )
    
    expect(screen.getByText('Crear Elemento')).toBeInTheDocument()
  })

  it('debe llamar onClick cuando se hace clic en el botón', () => {
    const handleAction = vi.fn()
    
    render(
      <EmptyState
        icon={Package}
        title="Test"
        description="Test"
        action={{
          label: 'Crear',
          onClick: handleAction
        }}
      />
    )
    
    const button = screen.getByText('Crear')
    fireEvent.click(button)
    
    expect(handleAction).toHaveBeenCalledTimes(1)
  })

  it('no debe renderizar botón si no hay action', () => {
    render(
      <EmptyState
        icon={Package}
        title="Test"
        description="Test"
      />
    )
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

