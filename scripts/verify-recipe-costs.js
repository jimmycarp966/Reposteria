const { createClient } = require('@supabase/supabase-js')

// Load environment variables manually
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      process.env[key] = valueParts.join('=')
    }
  })
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Función de conversión de unidades (copiada del UnitSelector)
const UNIT_OPTIONS = [
  // Peso (base: gramos)
  { value: 'g', label: 'Gramos (g)', category: 'weight', baseUnit: 'g', conversionFactor: 1 },
  { value: 'kg', label: 'Kilogramos (kg)', category: 'weight', baseUnit: 'g', conversionFactor: 1000 },
  { value: 'lb', label: 'Libras (lb)', category: 'weight', baseUnit: 'g', conversionFactor: 453.592 },
  { value: 'oz', label: 'Onzas (oz)', category: 'weight', baseUnit: 'g', conversionFactor: 28.3495 },
  
  // Volumen (base: mililitros)
  { value: 'ml', label: 'Mililitros (ml)', category: 'volume', baseUnit: 'ml', conversionFactor: 1 },
  { value: 'l', label: 'Litros (l)', category: 'volume', baseUnit: 'ml', conversionFactor: 1000 },
  { value: 'cup', label: 'Tazas (cup)', category: 'volume', baseUnit: 'ml', conversionFactor: 240 },
  { value: 'tbsp', label: 'Cucharadas (tbsp)', category: 'volume', baseUnit: 'ml', conversionFactor: 15 },
  { value: 'tsp', label: 'Cucharaditas (tsp)', category: 'volume', baseUnit: 'ml', conversionFactor: 5 },
  { value: 'fl_oz', label: 'Onzas fluidas (fl oz)', category: 'volume', baseUnit: 'ml', conversionFactor: 29.5735 },
  
  // Cantidad
  { value: 'pcs', label: 'Piezas (pcs)', category: 'count', baseUnit: 'pcs', conversionFactor: 1 },
  { value: 'units', label: 'Unidades', category: 'count', baseUnit: 'pcs', conversionFactor: 1 },
  { value: 'dozen', label: 'Docenas', category: 'count', baseUnit: 'pcs', conversionFactor: 12 },
  
  // Longitud
  { value: 'cm', label: 'Centímetros (cm)', category: 'length', baseUnit: 'cm', conversionFactor: 1 },
  { value: 'm', label: 'Metros (m)', category: 'length', baseUnit: 'cm', conversionFactor: 100 },
  { value: 'in', label: 'Pulgadas (in)', category: 'length', baseUnit: 'cm', conversionFactor: 2.54 },
  
  // Área
  { value: 'cm2', label: 'Centímetros cuadrados (cm²)', category: 'area', baseUnit: 'cm2', conversionFactor: 1 },
  { value: 'm2', label: 'Metros cuadrados (m²)', category: 'area', baseUnit: 'cm2', conversionFactor: 10000 },
]

function areUnitsCompatible(fromUnit, toUnit) {
  const fromUnitData = UNIT_OPTIONS.find(u => u.value === fromUnit)
  const toUnitData = UNIT_OPTIONS.find(u => u.value === toUnit)
  
  return fromUnitData && toUnitData && 
         fromUnitData.category === toUnitData.category &&
         fromUnitData.baseUnit === toUnitData.baseUnit
}

function convertUnits(value, fromUnit, toUnit) {
  const fromUnitData = UNIT_OPTIONS.find(u => u.value === fromUnit)
  const toUnitData = UNIT_OPTIONS.find(u => u.value === toUnit)

  if (!fromUnitData || !toUnitData) {
    return value
  }

  if (fromUnitData.category === toUnitData.category &&
      fromUnitData.baseUnit === toUnitData.baseUnit) {
    // Convertir a unidad base
    const baseValue = value * (fromUnitData.conversionFactor || 1)
    // Convertir de unidad base a unidad destino
    return baseValue / (toUnitData.conversionFactor || 1)
  }

  return value
}

async function verifyRecipeCosts() {
  console.log('🔍 Verificando costos de recetas...')
  
  try {
    // Obtener todas las recetas con sus ingredientes
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select(`
        id,
        name,
        servings,
        recipe_ingredients (
          id,
          quantity,
          unit,
          ingredient (
            id,
            name,
            cost_per_unit,
            unit
          )
        )
      `)

    if (error) throw error

    console.log(`📊 Encontradas ${recipes.length} recetas`)

    for (const recipe of recipes) {
      console.log(`\n🍰 Receta: ${recipe.name}`)
      console.log(`   Porciones: ${recipe.servings}`)
      
      let totalCost = 0
      let hasConversionIssues = false
      
      for (const ri of recipe.recipe_ingredients) {
        const ingredient = ri.ingredient
        let itemCost = 0
        
        console.log(`   📦 ${ingredient.name}: ${ri.quantity} ${ri.unit}`)
        console.log(`      Ingrediente en DB: ${ingredient.unit} - $${ingredient.cost_per_unit}`)
        
        // Calcular con conversión
        if (areUnitsCompatible(ri.unit, ingredient.unit)) {
          const convertedQuantity = convertUnits(ri.quantity, ri.unit, ingredient.unit)
          itemCost = convertedQuantity * ingredient.cost_per_unit
          console.log(`      ✅ Convertido: ${convertedQuantity} ${ingredient.unit} = $${itemCost.toFixed(2)}`)
        } else {
          itemCost = ri.quantity * ingredient.cost_per_unit
          console.log(`      ⚠️  Sin conversión: $${itemCost.toFixed(2)}`)
          hasConversionIssues = true
        }
        
        totalCost += itemCost
      }
      
      const costPerServing = totalCost / recipe.servings
      console.log(`   💰 Costo total: $${totalCost.toFixed(2)}`)
      console.log(`   💰 Costo por porción: $${costPerServing.toFixed(2)}`)
      
      if (hasConversionIssues) {
        console.log(`   ⚠️  Esta receta tiene problemas de conversión`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

verifyRecipeCosts()
