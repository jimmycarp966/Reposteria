// Script para crear la receta "Tarta de Camila"
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

// Ingredientes para la Tarta de Camila (combinados para evitar duplicados)
const recipeIngredients = [
  { name: 'Margarina', quantity: 0.220, unit: 'kg' },        // 220g = 0.220kg
  { name: 'Azúcar', quantity: 0.300, unit: 'kg' },           // 200g + 100g = 0.300kg
  { name: 'Huevos', quantity: 3, unit: 'unidad' },           // 1 + 2 = 3 huevos
  { name: 'Harina 000', quantity: 0.500, unit: 'kg' },       // 500g = 0.500kg
  { name: 'Polvo de hornear', quantity: 0.005, unit: 'kg' }, // 1 cdita ≈ 5g = 0.005kg
  { name: 'Dulce de leche', quantity: 0.400, unit: 'kg' },   // 400g = 0.400kg
  { name: 'Coco rallado', quantity: 1, unit: 'paquete' },    // 150g = 1 paquete
  { name: 'Crema de leche', quantity: 0.200, unit: 'litro' }, // 200g ≈ 0.200L
];

async function getIngredientIds() {
  console.log('🔍 Buscando IDs de ingredientes...');

  const ingredientIds = {};

  for (const ingredient of recipeIngredients) {
    const { data, error } = await supabase
      .from('ingredients')
      .select('id, name')
      .eq('name', ingredient.name)
      .single();

    if (error) {
      console.log(`❌ Error encontrando ${ingredient.name}:`, error.message);
      return null;
    }

    ingredientIds[ingredient.name] = data.id;
    console.log(`✅ ${ingredient.name}: ${data.id}`);
  }

  return ingredientIds;
}

async function createRecipe(ingredientIds) {
  console.log('\n🍰 Creando receta "Tarta de Camila"...');

  // Crear la receta
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert([{
      name: 'Tarta de Camila',
      description: 'Deliciosa tarta con dulce de leche y coco rallado',
      servings: 8, // Asumiendo que hace 8 porciones
    }])
    .select()
    .single();

  if (recipeError) {
    console.log('❌ Error creando receta:', recipeError.message);
    return null;
  }

  console.log(`✅ Receta creada con ID: ${recipe.id}`);

  // Crear los ingredientes de la receta
  const recipeIngredientsData = recipeIngredients.map(ing => ({
    recipe_id: recipe.id,
    ingredient_id: ingredientIds[ing.name],
    quantity: ing.quantity,
    unit: ing.unit,
  }));

  const { error: ingredientsError } = await supabase
    .from('recipe_ingredients')
    .insert(recipeIngredientsData);

  if (ingredientsError) {
    console.log('❌ Error creando ingredientes de receta:', ingredientsError.message);
    return null;
  }

  console.log(`✅ Agregados ${recipeIngredients.length} ingredientes a la receta`);

  return recipe;
}

async function calculateCost(recipeId) {
  console.log('\n💰 Calculando costo total de la receta...');

  const { data, error } = await supabase
    .rpc('calculate_recipe_cost', { recipe_id_param: recipeId });

  if (error) {
    console.log('❌ Error calculando costo:', error.message);
    return null;
  }

  console.log(`✅ Costo por porción: $${data}`);
  return data;
}

async function main() {
  const ingredientIds = await getIngredientIds();
  if (!ingredientIds) return;

  const recipe = await createRecipe(ingredientIds);
  if (!recipe) return;

  const costPerServing = await calculateCost(recipe.id);

  console.log('\n🎉 ¡RECETA CREADA EXITOSAMENTE!');
  console.log('================================');
  console.log(`📋 Nombre: ${recipe.name}`);
  console.log(`🍽️  Porciones: ${recipe.servings}`);
  console.log(`💰 Costo por porción: $${costPerServing}`);
  console.log(`🆔 ID de receta: ${recipe.id}`);
  console.log('================================');
}

main();
