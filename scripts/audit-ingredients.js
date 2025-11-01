// Script para AUDITAR completamente qué pasó con los ingredientes
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer archivo .env.local
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
  console.log('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function auditIngredients() {
  try {
    console.log('\n🔍 AUDITORÍA COMPLETA DE INGREDIENTES\n');
    console.log('='.repeat(60));

    // 1. Contar TOTAL de ingredientes en BD (sin paginación)
    console.log('\n1️⃣ CONTEO TOTAL DE INGREDIENTES');
    console.log('-'.repeat(60));
    const { count: totalCount, error: countError } = await supabase
      .from('ingredients')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Error:', countError.message);
      return;
    }

    console.log(`✅ Total de ingredientes en BD: ${totalCount || 0}`);

    // 2. Listar TODOS los ingredientes (sin límite)
    console.log('\n2️⃣ LISTADO COMPLETO DE INGREDIENTES (SIN PAGINACIÓN)');
    console.log('-'.repeat(60));
    const { data: allIngredients, error: allError } = await supabase
      .from('ingredients')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.log('❌ Error:', allError.message);
      return;
    }

    console.log(`Total obtenido: ${allIngredients?.length || 0}`);
    console.log('\nLista completa:');
    allIngredients?.forEach((ing, index) => {
      console.log(`  ${index + 1}. ${ing.name}`);
      console.log(`     ID: ${ing.id}`);
      console.log(`     Creado: ${ing.created_at}`);
      console.log(`     Unidad: ${ing.unit}`);
      console.log(`     Costo: $${ing.cost_per_unit}`);
      console.log('');
    });

    // 3. Simular lo que hace getIngredients() (página 1, 20 resultados)
    console.log('\n3️⃣ SIMULANDO getIngredients() - Página 1 (primeros 20)');
    console.log('-'.repeat(60));
    const { data: page1Ingredients, error: page1Error } = await supabase
      .from('ingredients')
      .select(`
        *,
        inventory (
          quantity,
          unit,
          location
        )
      `, { count: 'exact' })
      .range(0, 19)  // Primeros 20 (0-19)
      .order('name');

    if (page1Error) {
      console.log('❌ Error:', page1Error.message);
    } else {
      console.log(`Ingredientes devueltos por getIngredients(): ${page1Ingredients?.length || 0}`);
      
      if (allIngredients && allIngredients.length > (page1Ingredients?.length || 0)) {
        const missing = allIngredients.length - (page1Ingredients?.length || 0);
        console.log(`\n⚠️  PROBLEMA DETECTADO:`);
        console.log(`   - Total en BD: ${allIngredients.length}`);
        console.log(`   - Devueltos por getIngredients: ${page1Ingredients?.length || 0}`);
        console.log(`   - FALTAN ${missing} ingredientes que no aparecen en el frontend`);
        
        // Identificar cuáles faltan
        const page1Ids = new Set(page1Ingredients?.map(i => i.id) || []);
        const missingIngredients = allIngredients.filter(i => !page1Ids.has(i.id));
        
        console.log(`\n   Ingredientes que NO aparecen en el frontend:`);
        missingIngredients.forEach((ing, index) => {
          console.log(`   ${index + 1}. ${ing.name} (ID: ${ing.id})`);
          console.log(`      Creado: ${ing.created_at}`);
        });
      }
    }

    // 4. Verificar ingredientes creados recientemente (últimos 7 días)
    console.log('\n4️⃣ INGREDIENTES CREADOS EN LOS ÚLTIMOS 7 DÍAS');
    console.log('-'.repeat(60));
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentIngredients, error: recentError } = await supabase
      .from('ingredients')
      .select('*')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (recentError) {
      console.log('❌ Error:', recentError.message);
    } else {
      console.log(`Total creados en últimos 7 días: ${recentIngredients?.length || 0}`);
      recentIngredients?.forEach((ing, index) => {
        console.log(`  ${index + 1}. ${ing.name} - ${ing.created_at}`);
      });
    }

    // 5. Verificar si hay ingredientes sin inventory
    console.log('\n5️⃣ VERIFICACIÓN DE INVENTORY');
    console.log('-'.repeat(60));
    const { data: ingredientsWithInv, error: invError } = await supabase
      .from('ingredients')
      .select(`
        id,
        name,
        inventory (id)
      `);

    if (invError) {
      console.log('❌ Error:', invError.message);
    } else {
      const withoutInventory = ingredientsWithInv?.filter(ing => 
        !ing.inventory || (Array.isArray(ing.inventory) && ing.inventory.length === 0)
      ) || [];
      
      console.log(`Ingredientes SIN inventory: ${withoutInventory.length}`);
      if (withoutInventory.length > 0) {
        console.log('\nLista:');
        withoutInventory.forEach((ing, index) => {
          console.log(`  ${index + 1}. ${ing.name} (ID: ${ing.id})`);
        });
      }
    }

    // 6. RESUMEN FINAL
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN FINAL');
    console.log('='.repeat(60));
    console.log(`Total ingredientes en BD: ${allIngredients?.length || 0}`);
    console.log(`Mostrados en frontend (página 1): ${page1Ingredients?.length || 0}`);
    
    if (allIngredients && allIngredients.length > (page1Ingredients?.length || 0)) {
      console.log(`\n❌ PROBLEMA CRÍTICO:`);
      console.log(`   La aplicación solo muestra los primeros 20 ingredientes`);
      console.log(`   NO hay paginación en el frontend para ver los demás`);
      console.log(`   Por eso solo ves 20 ingredientes aunque hay más en la BD`);
    }

    console.log('\n✅ Auditoría completada\n');

  } catch (error) {
    console.log('❌ Error inesperado:', error);
  }
}

auditIngredients();


