// Script para crear producto desde la receta "Tarta de Camila"
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer credenciales
let supabaseUrl = null;
let supabaseAnonKey = null;

try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim();
      }
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
        supabaseAnonKey = line.split('=')[1].trim();
      }
    }
  }
} catch (error) {
  console.log('Error leyendo .env.local');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Credenciales no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findRecipeById(recipeId) {
  console.log(`🔍 Buscando receta con ID: ${recipeId}...`);

  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, servings')
    .eq('id', recipeId)
    .single();

  if (error) {
    console.log('❌ Error encontrando receta:', error.message);
    return null;
  }

  console.log(`✅ Receta encontrada: ${data.name} (ID: ${data.id})`);
  return data;
}

async function createProductFromRecipe(recipeId, markupPercent = 60) {
  console.log(`🛍️ Creando producto desde receta con ${markupPercent}% de margen...`);

  // Calcular el costo por porción
  const { data: costData, error: costError } = await supabase
    .rpc('calculate_recipe_cost', { recipe_id_param: recipeId });

  if (costError) {
    console.log('❌ Error calculando costo:', costError.message);
    return null;
  }

  const baseCostPerServing = costData;
  const suggestedPrice = baseCostPerServing * (1 + markupPercent / 100);

  // Obtener datos de la receta
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('name, image_url')
    .eq('id', recipeId)
    .single();

  if (recipeError) {
    console.log('❌ Error obteniendo receta:', recipeError.message);
    return null;
  }

  // Crear el producto
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert([{
      recipe_id: recipeId,
      name: `Tarta ${recipe.name}`, // "Tarta Tarta de Camila" no suena bien, mejor solo "Tarta de Camila"
      base_cost_cache: baseCostPerServing,
      suggested_price_cache: suggestedPrice,
      image_url: recipe.image_url,
    }])
    .select()
    .single();

  if (productError) {
    console.log('❌ Error creando producto:', productError.message);
    return null;
  }

  return {
    product,
    baseCostPerServing,
    suggestedPrice,
    markupPercent
  };
}

async function main() {
  const recipeId = '15151271-2300-4839-8f99-4ebfa91093ef'; // ID de la receta "Tarta de Camila" creada correctamente
  const markupPercent = 60; // 60% de margen

  // 1. Encontrar la receta
  const recipe = await findRecipeById(recipeId);
  if (!recipe) return;

  // 2. Crear producto desde la receta
  const result = await createProductFromRecipe(recipe.id, markupPercent);
  if (!result) return;

  const { product, baseCostPerServing, suggestedPrice, markupPercent: finalMarkup } = result;

  console.log('\n🎉 ¡PRODUCTO CREADO EXITOSAMENTE!');
  console.log('====================================');
  console.log(`📦 Nombre: ${product.name}`);
  console.log(`💰 Costo base por porción: $${baseCostPerServing}`);
  console.log(`📈 Margen aplicado: ${finalMarkup}%`);
  console.log(`💸 Precio sugerido: $${suggestedPrice.toFixed(2)}`);
  console.log(`🎯 Ganancia por porción: $${(suggestedPrice - baseCostPerServing).toFixed(2)}`);
  console.log(`🆔 ID del producto: ${product.id}`);
  console.log('====================================');

  console.log('\n📊 RESUMEN COMPLETO:');
  console.log(`🍰 Receta: ${recipe.name} (${recipe.servings} porciones)`);
  console.log(`📦 Producto: ${product.name}`);
  console.log(`💵 Precio de venta sugerido: $${suggestedPrice.toFixed(2)}`);
}

main();
