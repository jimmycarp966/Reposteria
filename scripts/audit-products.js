// Script para AUDITAR productos en Supabase
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

async function auditProducts() {
  try {
    console.log('\n🔍 AUDITORÍA COMPLETA DE PRODUCTOS\n');
    console.log('='.repeat(60));

    // 1. Contar TOTAL de productos en BD (sin paginación)
    console.log('\n1️⃣ CONTEO TOTAL DE PRODUCTOS');
    console.log('-'.repeat(60));
    const { count: totalCount, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Error:', countError.message);
      return;
    }

    console.log(`✅ Total de productos en BD: ${totalCount || 0}`);

    // 2. Listar TODOS los productos (sin límite)
    console.log('\n2️⃣ LISTADO COMPLETO DE PRODUCTOS (SIN PAGINACIÓN)');
    console.log('-'.repeat(60));
    const { data: allProducts, error: allError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.log('❌ Error:', allError.message);
      return;
    }

    console.log(`Total obtenido: ${allProducts?.length || 0}`);
    if (allProducts && allProducts.length > 0) {
      console.log('\nLista completa:');
      allProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name}`);
        console.log(`     ID: ${product.id}`);
        console.log(`     Creado: ${product.created_at}`);
        console.log(`     Costo: $${product.base_cost_cache}`);
        console.log(`     Precio: $${product.suggested_price_cache}`);
        console.log('');
      });
    }

    // 3. Simular lo que hace getProducts() (página 1, 20 resultados)
    console.log('\n3️⃣ SIMULANDO getProducts() - Página 1 (primeros 20)');
    console.log('-'.repeat(60));
    const { data: page1Products, error: page1Error } = await supabase
      .from('products')
      .select(`
        *,
        recipe:recipes (
          id,
          name,
          servings
        )
      `, { count: 'exact' })
      .range(0, 19)  // Primeros 20 (0-19)
      .order('created_at', { ascending: false });

    if (page1Error) {
      console.log('❌ Error:', page1Error.message);
    } else {
      console.log(`Productos devueltos por getProducts(): ${page1Products?.length || 0}`);
      
      if (allProducts && allProducts.length > (page1Products?.length || 0)) {
        const missing = allProducts.length - (page1Products?.length || 0);
        console.log(`\n⚠️  PROBLEMA DETECTADO:`);
        console.log(`   - Total en BD: ${allProducts.length}`);
        console.log(`   - Devueltos por getProducts: ${page1Products?.length || 0}`);
        console.log(`   - FALTAN ${missing} productos que no aparecen en el frontend`);
        
        // Identificar cuáles faltan
        const page1Ids = new Set(page1Products?.map(p => p.id) || []);
        const missingProducts = allProducts.filter(p => !page1Ids.has(p.id));
        
        console.log(`\n   Productos que NO aparecen en el frontend (página 1):`);
        missingProducts.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} (ID: ${product.id})`);
          console.log(`      Creado: ${product.created_at}`);
        });
      } else {
        console.log(`\n✅ No hay problema - todos los productos están en la página 1 o hay controles de paginación`);
      }
    }

    // 4. Verificar productos creados recientemente (últimos 7 días)
    console.log('\n4️⃣ PRODUCTOS CREADOS EN LOS ÚLTIMOS 7 DÍAS');
    console.log('-'.repeat(60));
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentProducts, error: recentError } = await supabase
      .from('products')
      .select('*')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (recentError) {
      console.log('❌ Error:', recentError.message);
    } else {
      console.log(`Total creados en últimos 7 días: ${recentProducts?.length || 0}`);
      recentProducts?.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} - ${product.created_at}`);
      });
    }

    // 5. RESUMEN FINAL
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN FINAL');
    console.log('='.repeat(60));
    console.log(`Total productos en BD: ${allProducts?.length || 0}`);
    console.log(`Mostrados en frontend (página 1): ${page1Products?.length || 0}`);
    
    if (allProducts && allProducts.length > (page1Products?.length || 0)) {
      console.log(`\n⚠️  SITUACIÓN:`);
      console.log(`   La aplicación solo muestra los primeros 20 productos`);
      console.log(`   Hay ${allProducts.length - (page1Products?.length || 0)} productos que requieren paginación`);
      console.log(`   VERIFICAR: ¿Hay controles de paginación funcionales en ProductsClient?`);
    } else {
      console.log(`\n✅ Todos los productos caben en la primera página`);
    }

    console.log('\n✅ Auditoría completada\n');

  } catch (error) {
    console.log('❌ Error inesperado:', error);
  }
}

auditProducts();

