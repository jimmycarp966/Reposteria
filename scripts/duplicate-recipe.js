// Script para duplicar una receta
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

async function duplicateRecipe(recipeId) {
  console.log(`🔄 Duplicando receta con ID: ${recipeId}`);

  try {
    // Obtener la receta original
    const { data: original, error: fetchError } = await supabase
      .from('recipes')
      .select(`
        *,
        recipe_ingredients (
          ingredient_id,
          quantity,
          unit
        )
      `)
      .eq('id', recipeId)
      .single();

    if (fetchError) {
      console.log('❌ Error obteniendo receta original:', fetchError.message);
      return;
    }

    console.log(`📋 Receta original: "${original.name}"`);

    // Crear la nueva receta
    const { data: newRecipe, error: recipeError } = await supabase
      .from('recipes')
      .insert([{
        name: `${original.name} (Copia)`,
        description: original.description,
        servings: original.servings,
        version: original.version + 1,
        image_url: original.image_url,
        active: true,
      }])
      .select()
      .single();

    if (recipeError) {
      console.log('❌ Error creando receta duplicada:', recipeError.message);
      return;
    }

    console.log(`✅ Nueva receta creada: "${newRecipe.name}" (ID: ${newRecipe.id})`);

    // Copiar los ingredientes
    if (original.recipe_ingredients && original.recipe_ingredients.length > 0) {
      const ingredientsToInsert = original.recipe_ingredients.map((ing) => ({
        recipe_id: newRecipe.id,
        ingredient_id: ing.ingredient_id,
        quantity: ing.quantity,
        unit: ing.unit,
      }));

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsToInsert);

      if (ingredientsError) {
        console.log('❌ Error copiando ingredientes:', ingredientsError.message);
        return;
      }

      console.log(`✅ Copiados ${ingredientsToInsert.length} ingredientes`);
    }

    console.log('\n🎉 ¡RECETA DUPLICADA EXITOSAMENTE!');
    console.log('================================');
    console.log(`📋 Nombre: ${newRecipe.name}`);
    console.log(`🍽️  Porciones: ${newRecipe.servings}`);
    console.log(`🆔 ID de receta: ${newRecipe.id}`);
    console.log('================================');

    return newRecipe;
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Usar el ID de la última receta creada
const recipeId = '80a4a63a-bf13-4650-99e8-586fd7cc5663'; // Cambiar por el ID correcto si es necesario
duplicateRecipe(recipeId);
