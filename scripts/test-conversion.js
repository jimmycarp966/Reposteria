// Test simple de conversión de unidades
const UNIT_OPTIONS = [
  // Peso (base: gramos)
  { value: 'g', label: 'Gramos (g)', category: 'weight', baseUnit: 'g', conversionFactor: 1 },
  { value: 'kg', label: 'Kilogramos (kg)', category: 'weight', baseUnit: 'g', conversionFactor: 1000 },
  
  // Volumen (base: mililitros)
  { value: 'ml', label: 'Mililitros (ml)', category: 'volume', baseUnit: 'ml', conversionFactor: 1 },
  { value: 'l', label: 'Litros (l)', category: 'volume', baseUnit: 'ml', conversionFactor: 1000 },
]

function convertUnits(value, fromUnit, toUnit) {
  const fromUnitData = UNIT_OPTIONS.find(u => u.value === fromUnit)
  const toUnitData = UNIT_OPTIONS.find(u => u.value === toUnit)

  if (!fromUnitData || !toUnitData) {
    return value
  }

  if (fromUnitData.category === toUnitData.category && 
      fromUnitData.baseUnit === toUnitData.baseUnit) {
    
    const baseValue = value * (fromUnitData.conversionFactor || 1)
    return baseValue / (toUnitData.conversionFactor || 1)
  }

  return value
}

// Test cases
console.log('🧪 Testing unit conversions:')
console.log('1 kg to g:', convertUnits(1, 'kg', 'g')) // Should be 1000
console.log('1000 g to kg:', convertUnits(1000, 'g', 'kg')) // Should be 1
console.log('1 l to ml:', convertUnits(1, 'l', 'ml')) // Should be 1000
console.log('1000 ml to l:', convertUnits(1000, 'ml', 'l')) // Should be 1

// Test with cost calculation
const costPerUnit = 3.5 // $3.5 per gram
const quantity = 1 // 1 kg
const unit = 'kg'
const ingredientUnit = 'g'

const convertedQuantity = convertUnits(quantity, unit, ingredientUnit)
const cost = convertedQuantity * costPerUnit

console.log(`\n💰 Cost calculation test:`)
console.log(`Quantity: ${quantity} ${unit}`)
console.log(`Converted to ${ingredientUnit}: ${convertedQuantity}`)
console.log(`Cost per ${ingredientUnit}: $${costPerUnit}`)
console.log(`Total cost: $${cost}`)
console.log(`Expected: $${1000 * 3.5} (1000g * $3.5/g)`)
