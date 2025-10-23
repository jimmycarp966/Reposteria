// Script para verificar las acciones de productos
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function testProductActions() {
  console.log('🔍 Verificando acciones de productos...\n');

  try {
    // Leer variables de entorno del archivo .env.local
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
      console.log('⚠️ No se pudo leer el archivo .env.local');
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('❌ Variables de entorno de Supabase no configuradas');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Verificar que las tablas existen y tienen datos
    console.log('📊 Consultando productos...');

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(`
        id,
        name,
        base_cost_cache,
        suggested_price_cache,
        recipe:recipes (
          name
        )
      `)
      .limit(5);

    if (productsError) {
      console.log('❌ Error al consultar productos:', productsError.message);
      return;
    }

    console.log(`✅ Encontrados ${products.length} productos`);
    console.log('');

    if (products.length > 0) {
      console.log('📋 Muestra de productos:');
      products.forEach((product, index) => {
        const recipeName = product.recipe?.name || 'Sin receta';
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   - Costo base: $${product.base_cost_cache}`);
        console.log(`   - Precio sugerido: $${product.suggested_price_cache}`);
        console.log(`   - Receta: ${recipeName}`);
        console.log('');
      });
    }

    // Verificar recetas disponibles
    console.log('📊 Consultando recetas...');
    const { data: recipes, error: recipesError } = await supabase
      .from("recipes")
      .select('id, name, servings, active')
      .eq('active', true)
      .limit(5);

    if (recipesError) {
      console.log('❌ Error al consultar recetas:', recipesError.message);
      return;
    }

    console.log(`✅ Encontradas ${recipes.length} recetas activas`);
    console.log('');

    if (recipes.length > 0) {
      console.log('📋 Muestra de recetas:');
      recipes.forEach((recipe, index) => {
        console.log(`${index + 1}. ${recipe.name} (${recipe.servings} porciones)`);
      });
      console.log('');
    } else {
      console.log('ℹ️ No hay recetas activas. El modo "Desde Receta" estará deshabilitado.');
      console.log('💡 Crea algunas recetas primero para poder crear productos desde ellas.');
    }

  } catch (error) {
    console.log('❌ Error en el test:', error.message);
  }
}

testProductActions();
