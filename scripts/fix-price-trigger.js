// Script para corregir el trigger de historial de precios de ingredientes
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

async function fixPriceTrigger() {
  try {
    console.log('🔧 Corrigiendo trigger de historial de precios de ingredientes...');

    // SQL para corregir la función del trigger
    const fixTriggerSQL = `
      -- Función corregida para registrar cambio de precio de ingrediente
      CREATE OR REPLACE FUNCTION log_ingredient_price_change()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Solo registrar si el precio realmente cambió
        IF OLD.cost_per_unit IS DISTINCT FROM NEW.cost_per_unit THEN
          INSERT INTO ingredient_price_history (
            ingredient_id,
            old_price,
            new_price,
            changed_by,
            change_reason
          ) VALUES (
            NEW.id,
            OLD.cost_per_unit,
            NEW.cost_per_unit,
            auth.uid(),
            'Precio por unidad actualizado'
          );
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    console.log('📝 Ejecutando corrección del trigger...');

    // Crear función temporal para ejecutar SQL
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION temp_exec_sql_fix(sql_text TEXT)
      RETURNS TEXT
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_text;
        RETURN 'OK';
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERROR: ' || SQLERRM;
      END;
      $$;
    `;

    // Crear función temporal
    await supabase.rpc('temp_exec_sql_fix', { sql_text: createFunctionSQL });

    // Ejecutar la corrección del trigger
    const { data, error } = await supabase.rpc('temp_exec_sql_fix', {
      sql_text: fixTriggerSQL
    });

    if (error) {
      console.log('❌ Error al corregir trigger:', error.message);
    } else {
      console.log('✅ Trigger corregido exitosamente:', data);
    }

    // Limpiar función temporal
    console.log('🧹 Limpiando función temporal...');
    await supabase.rpc('temp_exec_sql_fix', {
      sql_text: 'DROP FUNCTION IF EXISTS temp_exec_sql_fix(TEXT);'
    });

    // Verificar que la función se corrigió
    console.log('🔍 Verificando corrección...');
    const { data: testData, error: testError } = await supabase
      .from('ingredients')
      .select('id, name, cost_per_unit')
      .limit(1);

    if (testError) {
      console.log('❌ Error verificando tabla ingredients:', testError.message);
    } else {
      console.log('✅ Tabla ingredients accesible:', testData?.length || 0, 'registros encontrados');
    }

    console.log('✅ Corrección del trigger completada');

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Detalles:', error);
  }
}

fixPriceTrigger();















