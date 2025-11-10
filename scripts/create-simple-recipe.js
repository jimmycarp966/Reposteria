// Script para crear una receta simple de prueba
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

async function createTestRecipe() {
  console.log('🍰 Creando receta de prueba "Galletas de Prueba"...');

  // Crear la receta
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert([{
      name: 'Galletas de Prueba',
      description: 'Receta creada para probar paginación',
      servings: 12,
    }])
    .select()
    .single();

  if (recipeError) {
    console.log('❌ Error creando receta:', recipeError.message);
    return null;
  }

  console.log(`✅ Receta creada con ID: ${recipe.id}`);

  // Agregar algunos ingredientes simples (usando IDs conocidos)
  const ingredients = [
    { ingredient_id: '69802302-6bba-4934-9288-2038b4325f9b', quantity: 0.2, unit: 'kg' }, // Margarina
    { ingredient_id: '3fceae3a-8549-42bf-90d6-39a201a9063d', quantity: 0.25, unit: 'kg' }, // Azucar
    { ingredient_id: 'b8c16279-15a4-41c2-9fd7-da001b530892', quantity: 0.3, unit: 'kg' }, // Harina 000
  ];

  const recipeIngredientsData = ingredients.map(ing => ({
    recipe_id: recipe.id,
    ingredient_id: ing.ingredient_id,
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

  console.log(`✅ Agregados ${ingredients.length} ingredientes a la receta`);

  console.log('\n🎉 ¡RECETA DE PRUEBA CREADA EXITOSAMENTE!');
  console.log('================================');
  console.log(`📋 Nombre: ${recipe.name}`);
  console.log(`🍽️  Porciones: ${recipe.servings}`);
  console.log(`🆔 ID de receta: ${recipe.id}`);
  console.log('================================');

  return recipe;
}

createTestRecipe();
