// Definir las unidades y sus conversiones
const unitConversions: { [key: string]: { [key: string]: number } } = {
  // Peso
  'kg': {
    'g': 1000,
    'kg': 1,
    'lb': 2.20462,
    'oz': 35.274
  },
  'g': {
    'kg': 0.001,
    'g': 1,
    'lb': 0.00220462,
    'oz': 0.035274
  },
  'lb': {
    'kg': 0.453592,
    'g': 453.592,
    'lb': 1,
    'oz': 16
  },
  'oz': {
    'kg': 0.0283495,
    'g': 28.3495,
    'lb': 0.0625,
    'oz': 1
  },
  // Volumen
  'l': {
    'ml': 1000,
    'l': 1,
    'cup': 4.22675,
    'tbsp': 67.628,
    'tsp': 202.884
  },
  'ml': {
    'l': 0.001,
    'ml': 1,
    'cup': 0.00422675,
    'tbsp': 0.067628,
    'tsp': 0.202884
  },
  'cup': {
    'l': 0.236588,
    'ml': 236.588,
    'cup': 1,
    'tbsp': 16,
    'tsp': 48
  },
  'tbsp': {
    'l': 0.0147868,
    'ml': 14.7868,
    'cup': 0.0625,
    'tbsp': 1,
    'tsp': 3
  },
  'tsp': {
    'l': 0.00492892,
    'ml': 4.92892,
    'cup': 0.0208333,
    'tbsp': 0.333333,
    'tsp': 1
  },
  // Unidades
  'unit': {
    'unit': 1,
    'piece': 1,
    'pcs': 1
  },
  'piece': {
    'unit': 1,
    'piece': 1,
    'pcs': 1
  },
  'pcs': {
    'unit': 1,
    'piece': 1,
    'pcs': 1
  }
}

// Categorías de unidades para verificar compatibilidad
const unitCategories = {
  weight: ['kg', 'g', 'lb', 'oz'],
  volume: ['l', 'ml', 'cup', 'tbsp', 'tsp'],
  units: ['unit', 'piece', 'pcs']
}

export function getUnitCategory(unit: string): string | null {
  for (const [category, units] of Object.entries(unitCategories)) {
    if (units.includes(unit.toLowerCase())) {
      return category
    }
  }
  return null
}

export function areUnitsCompatibleServer(fromUnit: string, toUnit: string): boolean {
  if (!fromUnit || !toUnit) return false
  
  fromUnit = fromUnit.toLowerCase()
  toUnit = toUnit.toLowerCase()
  
  // Si son la misma unidad, son compatibles
  if (fromUnit === toUnit) return true
  
  // Verificar si pertenecen a la misma categoría
  const fromCategory = getUnitCategory(fromUnit)
  const toCategory = getUnitCategory(toUnit)
  
  return fromCategory !== null && fromCategory === toCategory
}

export function convertUnitsServer(quantity: number, fromUnit: string, toUnit: string): number {
  if (!fromUnit || !toUnit) return quantity
  
  fromUnit = fromUnit.toLowerCase()
  toUnit = toUnit.toLowerCase()
  
  // Si son la misma unidad, retornar la cantidad original
  if (fromUnit === toUnit) return quantity
  
  // Si las unidades no son compatibles, retornar la cantidad original
  if (!areUnitsCompatibleServer(fromUnit, toUnit)) return quantity
  
  // Buscar el factor de conversión
  if (unitConversions[fromUnit] && unitConversions[fromUnit][toUnit]) {
    return quantity * unitConversions[fromUnit][toUnit]
  }
  
  // Si no se encuentra la conversión, retornar la cantidad original
  return quantity
}
