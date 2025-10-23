"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface UnitOption {
  value: string
  label: string
  category: 'weight' | 'volume' | 'count' | 'length' | 'area'
  baseUnit?: string // Para conversiones
  conversionFactor?: number // Factor de conversión a la unidad base
}

export const UNIT_OPTIONS: UnitOption[] = [
  // Peso (base: gramos)
  { value: 'g', label: 'Gramos (g)', category: 'weight', baseUnit: 'g', conversionFactor: 1 },
  { value: 'kg', label: 'Kilogramos (kg)', category: 'weight', baseUnit: 'g', conversionFactor: 0.001 },
  { value: 'lb', label: 'Libras (lb)', category: 'weight', baseUnit: 'g', conversionFactor: 0.00220462 },
  { value: 'oz', label: 'Onzas (oz)', category: 'weight', baseUnit: 'g', conversionFactor: 0.035274 },
  
  // Volumen (base: mililitros)
  { value: 'ml', label: 'Mililitros (ml)', category: 'volume', baseUnit: 'ml', conversionFactor: 1 },
  { value: 'l', label: 'Litros (l)', category: 'volume', baseUnit: 'ml', conversionFactor: 0.001 },
  { value: 'cup', label: 'Tazas (cup)', category: 'volume', baseUnit: 'ml', conversionFactor: 0.00416667 },
  { value: 'tbsp', label: 'Cucharadas (tbsp)', category: 'volume', baseUnit: 'ml', conversionFactor: 0.0666667 },
  { value: 'tsp', label: 'Cucharaditas (tsp)', category: 'volume', baseUnit: 'ml', conversionFactor: 0.2 },
  { value: 'fl_oz', label: 'Onzas fluidas (fl oz)', category: 'volume', baseUnit: 'ml', conversionFactor: 0.033814 },
  
  // Cantidad
  { value: 'pcs', label: 'Piezas (pcs)', category: 'count', baseUnit: 'pcs', conversionFactor: 1 },
  { value: 'units', label: 'Unidades', category: 'count', baseUnit: 'pcs', conversionFactor: 1 },
  { value: 'dozen', label: 'Docenas', category: 'count', baseUnit: 'pcs', conversionFactor: 0.0833333 },
  
  // Longitud
  { value: 'cm', label: 'Centímetros (cm)', category: 'length', baseUnit: 'cm', conversionFactor: 1 },
  { value: 'm', label: 'Metros (m)', category: 'length', baseUnit: 'cm', conversionFactor: 0.01 },
  { value: 'in', label: 'Pulgadas (in)', category: 'length', baseUnit: 'cm', conversionFactor: 0.393701 },
  
  // Área
  { value: 'cm2', label: 'Centímetros cuadrados (cm²)', category: 'area', baseUnit: 'cm2', conversionFactor: 1 },
  { value: 'm2', label: 'Metros cuadrados (m²)', category: 'area', baseUnit: 'cm2', conversionFactor: 0.0001 },
]

interface UnitSelectorProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  categories?: UnitOption['category'][]
  showCategories?: boolean
}

export function UnitSelector({
  value,
  onChange,
  placeholder = "Seleccionar unidad",
  className,
  disabled = false,
  categories = ['weight', 'volume', 'count'],
  showCategories = false
}: UnitSelectorProps) {
  // Filtrar unidades por categorías permitidas
  const filteredUnits = UNIT_OPTIONS.filter(unit => 
    categories.includes(unit.category)
  )

  // Agrupar por categorías si se solicita
  const groupedUnits = showCategories 
    ? filteredUnits.reduce((acc, unit) => {
        if (!acc[unit.category]) {
          acc[unit.category] = []
        }
        acc[unit.category].push(unit)
        return acc
      }, {} as Record<string, UnitOption[]>)
    : null

  const getCategoryLabel = (category: string) => {
    const labels = {
      weight: 'Peso',
      volume: 'Volumen', 
      count: 'Cantidad',
      length: 'Longitud',
      area: 'Área'
    }
    return labels[category as keyof typeof labels] || category
  }

  if (showCategories && groupedUnits) {
    return (
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={cn("w-full", className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(groupedUnits).map(([category, units]) => (
            <div key={category}>
              <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                {getCategoryLabel(category)}
              </div>
              {units.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {filteredUnits.map((unit) => (
          <SelectItem key={unit.value} value={unit.value}>
            {unit.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Función utilitaria para conversiones
export function convertUnits(
  value: number,
  fromUnit: string,
  toUnit: string
): number {
  const fromUnitData = UNIT_OPTIONS.find(u => u.value === fromUnit)
  const toUnitData = UNIT_OPTIONS.find(u => u.value === toUnit)

  if (!fromUnitData || !toUnitData) {
    return value // No se puede convertir, devolver valor original
  }

  // Si son de la misma categoría, convertir
  if (fromUnitData.category === toUnitData.category && 
      fromUnitData.baseUnit === toUnitData.baseUnit) {
    
    // Convertir a unidad base
    const baseValue = value * (fromUnitData.conversionFactor || 1)
    // Convertir de unidad base a unidad destino
    return baseValue / (toUnitData.conversionFactor || 1)
  }

  return value // No se puede convertir entre categorías diferentes
}

// Función para obtener información de una unidad
export function getUnitInfo(unit: string): UnitOption | undefined {
  return UNIT_OPTIONS.find(u => u.value === unit)
}

// Función para validar si dos unidades son compatibles
export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  const unit1Data = getUnitInfo(unit1)
  const unit2Data = getUnitInfo(unit2)
  
  return unit1Data?.category === unit2Data?.category && 
         unit1Data?.baseUnit === unit2Data?.baseUnit
}
