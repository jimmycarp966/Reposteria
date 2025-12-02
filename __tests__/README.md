# 🧪 Tests del Sistema Cam Bake

Este directorio contiene todos los tests automatizados del sistema.

## 📊 Estado Actual

**Total de Tests**: 85 tests  
**Estado**: ✅ 100% pasando  
**Cobertura**: ~60% del código crítico  
**Framework**: Vitest + Testing Library

---

## 📁 Estructura de Tests

```
__tests__/
├── setup.ts                           # Configuración global de tests
├── unit/                              # Tests unitarios (55 tests)
│   ├── lib/
│   │   ├── utils.test.ts             # 7 tests - Utilidades generales
│   │   ├── cache.test.ts             # 8 tests - Sistema de caché
│   │   ├── cache-utils.test.ts       # 8 tests - Utilidades de caché
│   │   ├── logger.test.ts            # 9 tests - Sistema de logging
│   │   └── validations.test.ts       # 18 tests - Schemas Zod
│   └── hooks/
│       └── useDebounce.test.ts       # 5 tests - Hook debounce
├── integration/                       # Tests de integración (10 tests)
│   ├── recipe-cost-calculation.test.ts       # 5 tests
│   └── production-time-calculation.test.ts   # 5 tests
└── components/                        # Tests de componentes UI (20 tests)
    ├── SearchFilter.test.tsx          # 8 tests
    ├── ErrorAlert.test.tsx            # 7 tests
    └── EmptyState.test.tsx            # 5 tests
```

---

## 🚀 Comandos Disponibles

### Modo Watch (Recomendado para Desarrollo)
```bash
npm test
```
Los tests se re-ejecutan automáticamente cuando guardas cambios.

### Interface Visual
```bash
npm run test:ui
```
Abre una interfaz web interactiva para explorar y ejecutar tests.

### Una Ejecución (CI/CD)
```bash
npm run test:run
```
Ejecuta todos los tests una vez y muestra el resumen.

### Con Cobertura
```bash
npm run test:coverage
```
Genera reporte de cobertura de código en `coverage/`.

---

## 📝 Cómo Escribir Tests

### Test Unitario Básico

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from '@/lib/utils'

describe('myFunction', () => {
  it('debe retornar el valor esperado', () => {
    const result = myFunction('input')
    expect(result).toBe('expected output')
  })

  it('debe manejar casos edge', () => {
    expect(myFunction('')).toBe('')
    expect(myFunction(null)).toBeNull()
  })
})
```

### Test de Componente React

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('debe renderizar correctamente', () => {
    render(<MyComponent title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('debe manejar eventos', () => {
    const handleClick = vi.fn()
    render(<MyComponent onClick={handleClick} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Test de Integración

```typescript
import { describe, it, expect } from 'vitest'

describe('Flujo de Pedido Completo', () => {
  it('debe calcular costo correctamente', () => {
    const order = {
      items: [
        { quantity: 2, unit_price: 100 }
      ]
    }

    const total = order.items.reduce(
      (sum, item) => sum + (item.quantity * item.unit_price), 
      0
    )

    expect(total).toBe(200)
  })
})
```

---

## 🎯 Qué se Testea

### ✅ Utilidades (24 tests)
- Formateo de moneda y fechas
- Sistema de caché con TTL
- Limpieza de caché selectiva
- Logger con todos sus niveles

### ✅ Validaciones (18 tests)
- Ingredientes (nombre, unidad, costo)
- Recetas (nombre, porciones, ingredientes mínimos)
- Productos (nombre, costos, precios)
- Pedidos (tipo, fecha, items mínimos)
- Inventario (tipo de movimiento, cantidad)

### ✅ Hooks (5 tests)
- useDebounce con delays
- useDebouncedValue con estado
- Reset de timer en cambios rápidos

### ✅ Componentes UI (20 tests)
- SearchFilter (búsqueda, filtros, limpiar)
- ErrorAlert (renderizado, dismiss)
- EmptyState (renderizado, acciones)

### ✅ Integración (10 tests)
- Cálculos de costos de recetas
- Cálculos de tiempos de producción
- Márgenes de ganancia
- Buffers de producción

---

## 🔍 Cobertura de Tests

### Alta Cobertura (90-100%)
- ✅ `lib/utils.ts`
- ✅ `lib/cache.ts`
- ✅ `lib/cache-utils.ts`
- ✅ `lib/logger.ts`
- ✅ `lib/validations.ts`

### Media Cobertura (60-90%)
- ✅ `hooks/useDebounce.ts`
- ⏳ `hooks/useMutation.ts` (sin tests aún)
- ⏳ `hooks/useSearchFilter.ts` (sin tests aún)

### Baja Cobertura (0-60%)
- ⏳ Server Actions (lógica testeada indirectamente)
- ⏳ Componentes cliente complejos
- ⏳ Diálogos de creación

---

## 💡 Tips para Escribir Buenos Tests

### 1. Describe claramente qué testeas
```typescript
// ✅ Bueno
it('debe retornar error cuando el precio es negativo', () => {})

// ❌ Malo
it('test 1', () => {})
```

### 2. Usa AAA Pattern
```typescript
it('debe sumar correctamente', () => {
  // Arrange (Preparar)
  const a = 5
  const b = 3

  // Act (Actuar)
  const result = sum(a, b)

  // Assert (Verificar)
  expect(result).toBe(8)
})
```

### 3. Un concepto por test
```typescript
// ✅ Bueno - tests separados
it('debe validar email correcto', () => {})
it('debe rechazar email inválido', () => {})

// ❌ Malo - demasiado en un test
it('debe validar email', () => {
  // valida muchos casos diferentes
})
```

### 4. Mock solo lo necesario
```typescript
// ✅ Bueno - mock específico
vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() }
}))

// ❌ Malo - mock global de todo
vi.mock('next/navigation')
vi.mock('@/lib/supabase')
vi.mock('@/lib/cache')
```

---

## 🐛 Debugging de Tests

### Test falla pero debería pasar
```bash
# Ver output detallado
npm test -- --reporter=verbose

# Modo UI para debugging
npm run test:ui

# Ejecutar solo un archivo
npm test utils.test.ts
```

### Mock no funciona
```bash
# Verificar que el mock está antes del import
# Verificar la ruta del módulo mockeado
# Usar vi.clearAllMocks() en beforeEach
```

### Test muy lento
```bash
# Usar vi.useFakeTimers() para timers
# Reducir datasets de prueba
# Evitar sleeps/delays reales
```

---

## 📚 Referencias

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

---

**Mantenido por**: El equipo de desarrollo  
**Última actualización**: Octubre 2024

