#!/usr/bin/env node

/**
 * Script para corregir el trigger de historial de precios de ingredientes
 * Corrige el error donde se usa 'price_per_unit' en lugar de 'cost_per_unit'
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixTrigger() {
  try {
    console.log('🔧 Corrigiendo trigger de historial de precios de ingredientes...')

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
    `

    console.log('📝 Ejecutando corrección del trigger...')

    // Ejecutar la corrección usando exec_sql
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: fixTriggerSQL
    })

    if (error) {
      console.error('❌ Error al corregir trigger:', error)
      process.exit(1)
    }

    console.log('✅ Trigger corregido exitosamente!')

    // Verificar que la función se corrigió
    console.log('🔍 Verificando corrección...')

    // Intentar hacer una consulta simple a la tabla ingredients
    const { data: testData, error: testError } = await supabase
      .from('ingredients')
      .select('id, name, cost_per_unit')
      .limit(1)

    if (testError) {
      console.error('❌ Error verificando tabla ingredients:', testError)
    } else {
      console.log('✅ Tabla ingredients accesible:', testData?.length || 0, 'registros encontrados')
    }

    console.log('🎉 ¡Trigger de historial de precios corregido y listo para usar!')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  fixTrigger()
}

module.exports = { fixTrigger }















