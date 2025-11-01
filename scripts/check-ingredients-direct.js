// Script para verificar ingredientes en Supabase usando consultas SQL directas
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
  console.log('💡 Crea un archivo .env.local con las credenciales de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkIngredientsSQL() {
  try {
    console.log('\n🔍 VERIFICANDO INGREDIENTES EN SUPABASE (Consulta SQL Directa)...\n');

    // 1. Contar total de ingredientes
    console.log('1️⃣ Contando total de ingredientes...');
    const { data: countData, error: countError } = await supabase
      .from('ingredients')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Error:', countError.message);
      return;
    }

    console.log(`   ✅ Total de ingredientes en BD: ${countData || 0}\n`);

    // 2. Listar TODOS los ingredientes (sin paginación)
    console.log('2️⃣ Listando TODOS los ingredientes (sin paginación)...');
    const { data: allIngredients, error: allError } = await supabase
      .from('ingredients')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.log('❌ Error:', allError.message);
      return;
    }

    console.log(`   ✅ Total obtenido: ${allIngredients?.length || 0}`);
    if (allIngredients && allIngredients.length > 0) {
      console.log('\n   📋 Lista completa de ingredientes:');
      allIngredients.forEach((ing, index) => {
        console.log(`   ${index + 1}. ${ing.name}`);
        console.log(`      - ID: ${ing.id}`);
        console.log(`      - Unidad: ${ing.unit}`);
        console.log(`      - Costo: $${ing.cost_per_unit}`);
        console.log(`      - Creado: ${ing.created_at}`);
        console.log('');
      });
    }

    // 3. Verificar ingredientes con y sin registro de inventory
    console.log('3️⃣ Verificando ingredientes con/sin inventory...');
    const { data: ingredientsWithInventory, error: invError } = await supabase
      .from('ingredients')
      .select(`
        id,
        name,
        unit,
        inventory (
          id,
          quantity,
          unit,
          location
        )
      `)
      .order('created_at', { ascending: false });

    if (invError) {
      console.log('❌ Error:', invError.message);
      console.log('   Código:', invError.code);
      console.log('   Detalles:', invError.details);
      return;
    }

    console.log(`   ✅ Total obtenido con relación: ${ingredientsWithInventory?.length || 0}\n`);

    const withInventory = ingredientsWithInventory?.filter(ing => 
      ing.inventory && (Array.isArray(ing.inventory) ? ing.inventory.length > 0 : ing.inventory !== null)
    ) || [];
    const withoutInventory = ingredientsWithInventory?.filter(ing => 
      !ing.inventory || (Array.isArray(ing.inventory) && ing.inventory.length === 0)
    ) || [];

    console.log(`   📊 Ingredientes CON inventory: ${withInventory.length}`);
    console.log(`   ⚠️  Ingredientes SIN inventory: ${withoutInventory.length}\n`);

    if (withoutInventory.length > 0) {
      console.log('   🔍 Ingredientes SIN registro de inventory:');
      withoutInventory.forEach((ing, index) => {
        console.log(`   ${index + 1}. ${ing.name} (ID: ${ing.id})`);
      });
      console.log('');
    }

    // 4. Verificar los últimos 10 ingredientes creados
    console.log('4️⃣ Últimos 10 ingredientes creados:');
    const lastTen = allIngredients?.slice(0, 10) || [];
    lastTen.forEach((ing, index) => {
      const hasInventory = ingredientsWithInventory?.find(i => i.id === ing.id);
      const invStatus = hasInventory && hasInventory.inventory && 
        (Array.isArray(hasInventory.inventory) ? hasInventory.inventory.length > 0 : hasInventory.inventory !== null)
        ? '✅ Con inventory' : '❌ Sin inventory';
      
      console.log(`   ${index + 1}. ${ing.name} - ${invStatus}`);
      console.log(`      Creado: ${ing.created_at}`);
    });

    // 5. Comparar con lo que devuelve getIngredients (simulando la consulta de la app)
    console.log('\n5️⃣ Simulando consulta de getIngredients() (página 1, 20 resultados)...');
    const { data: paginatedIngredients, error: pageError } = await supabase
      .from('ingredients')
      .select(`
        *,
        inventory (
          quantity,
          unit,
          location
        )
      `, { count: 'exact' })
      .range(0, 19)
      .order('name');

    if (pageError) {
      console.log('❌ Error en consulta paginada:', pageError.message);
      console.log('   Código:', pageError.code);
      console.log('   Detalles:', pageError.details);
    } else {
      console.log(`   ✅ Ingredientes devueltos por getIngredients(): ${paginatedIngredients?.length || 0}`);
      console.log(`   📊 Total según count: ${paginatedIngredients?.length || 0}`);
      
      if (allIngredients && allIngredients.length !== (paginatedIngredients?.length || 0)) {
        console.log(`\n   ⚠️  DIFERENCIA DETECTADA:`);
        console.log(`      - Total en BD: ${allIngredients.length}`);
        console.log(`      - Devueltos por getIngredients: ${paginatedIngredients?.length || 0}`);
        console.log(`      - Diferencia: ${allIngredients.length - (paginatedIngredients?.length || 0)} ingredientes`);
      }
    }

    // 6. Resumen final
    console.log('\n📊 RESUMEN FINAL:');
    console.log(`   Total de ingredientes en BD: ${allIngredients?.length || 0}`);
    console.log(`   Con inventory: ${withInventory.length}`);
    console.log(`   Sin inventory: ${withoutInventory.length}`);
    console.log(`   Devueltos por getIngredients(): ${paginatedIngredients?.length || 0}`);

    if (allIngredients && allIngredients.length > (paginatedIngredients?.length || 0)) {
      console.log('\n   ⚠️  PROBLEMA IDENTIFICADO:');
      console.log(`      Hay ${allIngredients.length - (paginatedIngredients?.length || 0)} ingredientes que no aparecen en getIngredients()`);
      console.log('      Posibles causas:');
      console.log('      1. Problema con la relación inventory en Supabase');
      console.log('      2. Problema de permisos RLS (Row Level Security)');
      console.log('      3. Problema con la paginación');
    }

    console.log('\n✅ Verificación completada\n');

  } catch (error) {
    console.log('❌ Error inesperado:', error);
  }
}

checkIngredientsSQL();

