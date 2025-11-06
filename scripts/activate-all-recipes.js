// Script para activar todas las recetas existentes
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
  console.log('❌ Error leyendo .env.local');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Credenciales no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function activateAllRecipes() {
  console.log('🔄 Activando todas las recetas existentes...\n');

  // Primero, verificar cuántas recetas hay que activar
  const { data: recipesToActivate, error: checkError } = await supabase
    .from('recipes')
    .select('id, name, active')
    .or('active.is.null,active.eq.false');

  if (checkError) {
    console.log('❌ Error verificando recetas:', checkError.message);
    return;
  }

  if (!recipesToActivate || recipesToActivate.length === 0) {
    console.log('✅ Todas las recetas ya están activas');
    return;
  }

  console.log(`📋 Encontradas ${recipesToActivate.length} receta(s) para activar:`);
  recipesToActivate.forEach(recipe => {
    console.log(`   - ${recipe.name} (ID: ${recipe.id})`);
  });
  console.log('');

  // Activar todas las recetas usando los IDs encontrados
  const recipeIds = recipesToActivate.map(r => r.id);
  
  // Actualizar todas las recetas
  const { error: updateError } = await supabase
    .from('recipes')
    .update({ active: true })
    .in('id', recipeIds);

  if (updateError) {
    console.log('❌ Error activando recetas:', updateError.message);
    return;
  }

  // Verificar que se actualizaron correctamente
  const { data: verifiedRecipes, error: verifyError } = await supabase
    .from('recipes')
    .select('id, name, active')
    .in('id', recipeIds)
    .eq('active', true);

  if (verifyError) {
    console.log('⚠️  Recetas actualizadas pero no se pudo verificar:', verifyError.message);
    console.log(`✅ ${recipeIds.length} receta(s) deberían estar activadas`);
  } else {
    console.log(`✅ ${verifiedRecipes?.length || 0} receta(s) activada(s) exitosamente`);
  }
  console.log('\n💡 Ahora las recetas deberían aparecer en el selector de productos.');
}

activateAllRecipes()
  .then(() => {
    console.log('\n✨ Proceso completado');
    // Dar tiempo para que las conexiones HTTP se cierren correctamente
    setTimeout(() => {
      process.exit(0);
    }, 100);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    setTimeout(() => {
      process.exit(1);
    }, 100);
  });

