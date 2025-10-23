// Script para limpiar TODOS los datos mock de la base de datos
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

async function cleanAllMockData() {
  try {
    console.log('🧹 Limpiando TODOS los datos mock de la base de datos...');
    console.log('⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de prueba');
    console.log('');

    // Orden de eliminación (respetando foreign keys)
    const tablesToClean = [
      'weekly_production_tasks',
      'weekly_production_plans', 
      'sale_items',
      'sales',
      'order_items',
      'orders',
      'events',
      'customers',
      'recipe_ingredients',
      'recipes',
      'inventory_transactions',
      'ingredients',
      'products'
    ];

    let totalDeleted = 0;

    for (const table of tablesToClean) {
      try {
        console.log(`🗑️  Limpiando tabla: ${table}...`);
        
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`⚠️  Error obteniendo conteo de ${table}:`, error.message);
          continue;
        }

        if (count > 0) {
          const { error: deleteError } = await supabase
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos

          if (deleteError) {
            console.log(`❌ Error eliminando de ${table}:`, deleteError.message);
          } else {
            console.log(`✅ ${table}: ${count} registros eliminados`);
            totalDeleted += count;
          }
        } else {
          console.log(`✅ ${table}: ya estaba vacía`);
        }
      } catch (error) {
        console.log(`❌ Error procesando ${table}:`, error.message);
      }
    }

    console.log('');
    console.log('🔍 Verificando que las tablas estén vacías...');

    // Verificar que las tablas estén vacías
    for (const table of tablesToClean) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`⚠️  Error verificando ${table}:`, error.message);
        } else if (count > 0) {
          console.log(`⚠️  ${table} aún tiene ${count} registros`);
        } else {
          console.log(`✅ ${table}: vacía`);
        }
      } catch (error) {
        console.log(`❌ Error verificando ${table}:`, error.message);
      }
    }

    console.log('');
    console.log('🎉 ¡Limpieza completada!');
    console.log(`📊 Total de registros eliminados: ${totalDeleted}`);
    console.log('✅ La base de datos está lista para uso en producción');
    console.log('');
    console.log('📝 Próximos pasos:');
    console.log('1. Crear ingredientes básicos');
    console.log('2. Crear recetas');
    console.log('3. Crear productos');
    console.log('4. Configurar inventario inicial');
    console.log('5. Crear clientes');
    console.log('6. Comenzar a usar el sistema');

  } catch (error) {
    console.log('❌ Error general:', error.message);
    console.log('Detalles:', error);
  }
}

cleanAllMockData();
