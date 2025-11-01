// Script para verificar ingredientes en Supabase
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

async function checkIngredients() {
  try {
    console.log('\n🔍 VERIFICANDO INGREDIENTES EN SUPABASE...\n');

    // 1. Consultar TODOS los ingredientes directamente (sin relación con inventory)
    console.log('1️⃣ Consultando ingredientes directamente (sin inventory)...');
    const { data: ingredientsDirect, error: errorDirect } = await supabase
      .from('ingredients')
      .select('*')
      .order('created_at', { ascending: false });

    if (errorDirect) {
      console.log('❌ Error al consultar ingredientes directamente:', errorDirect);
      return;
    }

    console.log(`   ✅ Total de ingredientes en BD: ${ingredientsDirect?.length || 0}`);
    if (ingredientsDirect && ingredientsDirect.length > 0) {
      console.log('\n   📋 Lista de ingredientes:');
      ingredientsDirect.forEach((ing, index) => {
        console.log(`   ${index + 1}. ${ing.name} (ID: ${ing.id})`);
        console.log(`      - Unidad: ${ing.unit}`);
        console.log(`      - Costo: $${ing.cost_per_unit}`);
        console.log(`      - Creado: ${ing.created_at}`);
      });
    }

    // 2. Consultar ingredientes CON la relación inventory (como lo hace getIngredients)
    console.log('\n2️⃣ Consultando ingredientes CON relación inventory (como getIngredients)...');
    const { data: ingredientsWithInventory, error: errorWithInventory } = await supabase
      .from('ingredients')
      .select(`
        *,
        inventory (
          quantity,
          unit,
          location
        )
      `)
      .order('name');

    if (errorWithInventory) {
      console.log('❌ Error al consultar con relación inventory:', errorWithInventory);
      console.log('   Mensaje:', errorWithInventory.message);
      console.log('   Código:', errorWithInventory.code);
      console.log('   Detalles:', errorWithInventory.details);
      return;
    }

    console.log(`   ✅ Total de ingredientes con relación: ${ingredientsWithInventory?.length || 0}`);
    
    if (ingredientsWithInventory && ingredientsWithInventory.length > 0) {
      console.log('\n   📋 Ingredientes con relación inventory:');
      ingredientsWithInventory.forEach((ing, index) => {
        console.log(`   ${index + 1}. ${ing.name} (ID: ${ing.id})`);
        if (ing.inventory && ing.inventory.length > 0) {
          ing.inventory.forEach((inv, invIndex) => {
            console.log(`      📦 Inventory ${invIndex + 1}: ${inv.quantity} ${inv.unit}`);
          });
        } else if (ing.inventory === null || ing.inventory === undefined) {
          console.log(`      ⚠️  Sin registro de inventory`);
        } else {
          console.log(`      ⚠️  Inventory: ${JSON.stringify(ing.inventory)}`);
        }
      });
    }

    // 3. Comparar resultados
    console.log('\n3️⃣ COMPARANDO RESULTADOS...');
    const directCount = ingredientsDirect?.length || 0;
    const withInventoryCount = ingredientsWithInventory?.length || 0;
    
    console.log(`   Ingredientes directos: ${directCount}`);
    console.log(`   Ingredientes con relación: ${withInventoryCount}`);
    
    if (directCount !== withInventoryCount) {
      console.log(`\n   ⚠️  DIFERENCIA DETECTADA: Hay ${directCount - withInventoryCount} ingrediente(s) que no aparecen con la relación inventory`);
      
      // Encontrar cuáles faltan
      const directIds = new Set(ingredientsDirect.map(ing => ing.id));
      const withInventoryIds = new Set(ingredientsWithInventory.map(ing => ing.id));
      
      const missingIds = [...directIds].filter(id => !withInventoryIds.has(id));
      if (missingIds.length > 0) {
        console.log('\n   🔍 Ingredientes que faltan en la consulta con relación:');
        missingIds.forEach(id => {
          const ing = ingredientsDirect.find(i => i.id === id);
          console.log(`      - ${ing.name} (ID: ${ing.id})`);
        });
      }
    } else {
      console.log(`   ✅ Ambos resultados coinciden`);
    }

    // 4. Verificar registros de inventory
    console.log('\n4️⃣ Verificando registros de inventory...');
    const { data: allInventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('*')
      .order('last_updated', { ascending: false });

    if (inventoryError) {
      console.log('   ⚠️  Error al consultar inventory:', inventoryError.message);
    } else {
      console.log(`   ✅ Total de registros en inventory: ${allInventory?.length || 0}`);
      
      if (allInventory && allInventory.length > 0) {
        console.log('\n   📦 Registros de inventory:');
        allInventory.forEach((inv, index) => {
          console.log(`   ${index + 1}. Ingredient ID: ${inv.ingredient_id}`);
          console.log(`      - Cantidad: ${inv.quantity} ${inv.unit}`);
          console.log(`      - Actualizado: ${inv.last_updated}`);
        });
      }
    }

    // 5. Verificar si hay ingredientes sin registro de inventory
    console.log('\n5️⃣ Verificando ingredientes sin registro de inventory...');
    const ingredientIds = new Set(ingredientsDirect.map(ing => ing.id));
    const inventoryIngredientIds = new Set(allInventory?.map(inv => inv.ingredient_id) || []);
    
    const ingredientsWithoutInventory = ingredientsDirect.filter(ing => !inventoryIngredientIds.has(ing.id));
    
    if (ingredientsWithoutInventory.length > 0) {
      console.log(`   ⚠️  Hay ${ingredientsWithoutInventory.length} ingrediente(s) sin registro de inventory:`);
      ingredientsWithoutInventory.forEach(ing => {
        console.log(`      - ${ing.name} (ID: ${ing.id})`);
      });
      console.log('\n   💡 Estos ingredientes podrían no aparecer en getIngredients() si la relación falla');
    } else {
      console.log('   ✅ Todos los ingredientes tienen registro de inventory');
    }

    console.log('\n✅ Verificación completada\n');

  } catch (error) {
    console.log('❌ Error inesperado:', error);
  }
}

checkIngredients();
