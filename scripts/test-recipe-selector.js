// Script para probar que el selector de recetas funciona correctamente
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

async function testRecipeSelector() {
  console.log('🧪 Probando selector de recetas para productos...\n');

  // Simular la llamada que hace el componente CreateProductDialog
  const result = await supabase
    .from('recipes')
    .select('id, name, servings, description')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (result.error) {
    console.log('❌ Error obteniendo recipes:', result.error.message);
    return;
  }

  console.log('✅ Recipes obtenidas correctamente');
  console.log(`📊 Total de recipes activas: ${result.data.length}\n`);

  // Mostrar las primeras 10 recipes para verificar
  console.log('📋 Primeras 10 recipes disponibles en el selector:');
  console.log('==================================================');

  result.data.slice(0, 10).forEach((recipe, index) => {
    console.log(`${index + 1}. ${recipe.name}`);
    console.log(`   🆔 ID: ${recipe.id}`);
    console.log(`   🍽️  Porciones: ${recipe.servings}`);
    if (recipe.description) {
      console.log(`   📝 Descripción: ${recipe.description}`);
    }
    console.log('');
  });

  if (result.data.length > 10) {
    console.log(`... y ${result.data.length - 10} recipes más`);
  }

  console.log('\n✅ El selector debería mostrar todas estas recipes');
  console.log('✅ La búsqueda debería filtrar por nombre y descripción');
  console.log('✅ La selección debería funcionar normalmente');

  // Verificar que las recipes más recientes están incluidas
  const recentRecipes = result.data.filter(recipe =>
    recipe.name.includes('Galletas de Prueba')
  );

  if (recentRecipes.length > 0) {
    console.log('\n✅ Recipes de prueba encontradas:');
    recentRecipes.forEach(recipe => {
      console.log(`   - "${recipe.name}" (ID: ${recipe.id})`);
    });
  } else {
    console.log('\n⚠️  No se encontraron recipes de prueba');
  }
}

testRecipeSelector();
