/**
 * Tests para el componente SearchFilter
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchFilter } from '@/components/shared/SearchFilter'

describe('SearchFilter Component', () => {
  it('debe renderizar correctamente', () => {
    render(
      <SearchFilter
        searchValue=""
        onSearchChange={vi.fn()}
        onClearSearch={vi.fn()}
      />
    )
    
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument()
  })

  it('debe mostrar el valor de búsqueda', () => {
    render(
      <SearchFilter
        searchValue="test"
        onSearchChange={vi.fn()}
        onClearSearch={vi.fn()}
      />
    )
    
    const input = screen.getByPlaceholderText('Buscar...') as HTMLInputElement
    expect(input.value).toBe('test')
  })

  it('debe llamar onSearchChange cuando se escribe', () => {
    const handleChange = vi.fn()
    
    render(
      <SearchFilter
        searchValue=""
        onSearchChange={handleChange}
        onClearSearch={vi.fn()}
      />
    )
    
    const input = screen.getByPlaceholderText('Buscar...')
    fireEvent.change(input, { target: { value: 'new search' } })
    
    expect(handleChange).toHaveBeenCalledWith('new search')
  })

  it('debe mostrar botón de limpiar cuando hay búsqueda', () => {
    render(
      <SearchFilter
        searchValue="test"
        onSearchChange={vi.fn()}
        onClearSearch={vi.fn()}
      />
    )
    
    // El botón X aparece cuando hay búsqueda
    const clearButtons = screen.getAllByRole('button')
    expect(clearButtons.length).toBeGreaterThan(0)
  })

  it('debe llamar onClearSearch al hacer clic en X', () => {
    const handleClear = vi.fn()
    
    render(
      <SearchFilter
        searchValue="test"
        onSearchChange={vi.fn()}
        onClearSearch={handleClear}
      />
    )
    
    // Buscar el botón X (está dentro del input)
    const clearButtons = screen.getAllByRole('button')
    fireEvent.click(clearButtons[0])
    
    expect(handleClear).toHaveBeenCalled()
  })

  it('debe renderizar filtros cuando se proporcionan', () => {
    const filterOptions = [
      {
        label: 'Estado',
        key: 'status',
        options: [
          { value: 'active', label: 'Activo' },
          { value: 'inactive', label: 'Inactivo' }
        ]
      }
    ]

    render(
      <SearchFilter
        searchValue=""
        onSearchChange={vi.fn()}
        onClearSearch={vi.fn()}
        filterOptions={filterOptions}
      />
    )
    
    // Verificar que se renderiza un select (combobox)
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(screen.getByText('Todos')).toBeInTheDocument()
  })

  it('debe mostrar placeholder personalizado', () => {
    render(
      <SearchFilter
        searchValue=""
        onSearchChange={vi.fn()}
        onClearSearch={vi.fn()}
        placeholder="Buscar productos..."
      />
    )
    
    expect(screen.getByPlaceholderText('Buscar productos...')).toBeInTheDocument()
  })

  it('debe mostrar indicador de búsqueda cuando isSearching es true', () => {
    const { container } = render(
      <SearchFilter
        searchValue="test"
        onSearchChange={vi.fn()}
        onClearSearch={vi.fn()}
        isSearching={true}
      />
    )
    
    // Verificar que existe el spinner (elemento con clase animate-spin)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })
})

