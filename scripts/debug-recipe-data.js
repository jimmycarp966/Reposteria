// Script para depurar datos de recetas
const { createClient } = require('@supabase/supabase-js')

// Cargar variables de entorno manualmente
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

// Función de conversión (copiada del UnitSelector)
const UNIT_OPTIONS = [
  { value: 'g', label: 'Gramos (g)', category: 'weight', baseUnit: 'g', conversionFactor: 1 },
  { value: 'kg', label: 'Kilogramos (kg)', category: 'weight', baseUnit: 'g', conversionFactor: 1000 },
  { value: 'ml', label: 'Mililitros (ml)', category: 'volume', baseUnit: 'ml', conversionFactor: 1 },
  { value: 'l', label: 'Litros (l)', category: 'volume', baseUnit: 'ml', conversionFactor: 1000 },
  { value: 'pcs', label: 'Piezas (pcs)', category: 'count', baseUnit: 'pcs', conversionFactor: 1 },
  { value: 'units', label: 'Unidades', category: 'count', baseUnit: 'pcs', conversionFactor: 1 },
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
    const baseValue = value * (fromUnitData.conversionFactor || 1)
    return baseValue / (toUnitData.conversionFactor || 1)
  }

  return value
}

async function debugRecipeData() {
  console.log('🔍 Depurando datos de recetas...')
  
  try {
    // Obtener recetas con ingredientes
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
      .limit(5)

    if (error) throw error

    console.log(`📊 Encontradas ${recipes.length} recetas`)

    for (const recipe of recipes) {
      console.log(`\n🍰 Receta: ${recipe.name}`)
      console.log(`   Porciones: ${recipe.servings}`)
      
      let totalCost = 0
      
      for (const ri of recipe.recipe_ingredients) {
        const ingredient = ri.ingredient
        let itemCost = 0
        
        console.log(`\n  📦 ${ingredient.name}:`)
        console.log(`     Cantidad en receta: ${ri.quantity} ${ri.unit}`)
        console.log(`     Unidad del ingrediente: ${ingredient.unit}`)
        console.log(`     Costo por unidad: $${ingredient.cost_per_unit}`)
        
        // Verificar compatibilidad
        const compatible = areUnitsCompatible(ri.unit, ingredient.unit)
        console.log(`     Unidades compatibles: ${compatible}`)
        
        if (compatible) {
          const convertedQuantity = convertUnits(ri.quantity, ri.unit, ingredient.unit)
          itemCost = convertedQuantity * ingredient.cost_per_unit
          console.log(`     ✅ Convertido: ${convertedQuantity} ${ingredient.unit}`)
          console.log(`     ✅ Costo: $${itemCost.toFixed(2)}`)
        } else {
          itemCost = ri.quantity * ingredient.cost_per_unit
          console.log(`     ⚠️  Sin conversión: $${itemCost.toFixed(2)}`)
        }
        
        totalCost += itemCost
      }
      
      const costPerServing = totalCost / recipe.servings
      console.log(`\n💰 RESULTADO FINAL:`)
      console.log(`   Costo total: $${totalCost.toFixed(2)}`)
      console.log(`   Costo por porción: $${costPerServing.toFixed(2)}`)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

debugRecipeData()
