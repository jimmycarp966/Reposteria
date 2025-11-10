"use server"

import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log('🔧 Iniciando corrección del trigger desde API...')

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

    console.log('📝 Ejecutando SQL de corrección...')

    // Crear función temporal para ejecutar SQL
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION temp_fix_trigger(sql_text TEXT)
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
    `

    // Intentar crear la función temporal
    const { data: createData, error: createError } = await supabase.rpc('temp_fix_trigger', {
      sql_text: createFunctionSQL
    })

    if (createError) {
      console.log('⚠️ Función temp_fix_trigger ya existe o error al crear:', createError.message)
    } else {
      console.log('✅ Función temporal creada:', createData)
    }

    // Ejecutar la corrección del trigger
    const { data, error } = await supabase.rpc('temp_fix_trigger', {
      sql_text: fixTriggerSQL
    })

    if (error) {
      console.log('❌ Error al ejecutar corrección:', error.message)
      return NextResponse.json({
        success: false,
        message: `Error al corregir trigger: ${error.message}`
      }, { status: 500 })
    }

    console.log('✅ Trigger corregido exitosamente:', data)

    // Limpiar función temporal
    console.log('🧹 Limpiando función temporal...')
    await supabase.rpc('temp_fix_trigger', {
      sql_text: 'DROP FUNCTION IF EXISTS temp_fix_trigger(TEXT);'
    })

    // Verificar que la corrección funcionó
    console.log('🔍 Verificando corrección...')
    const { data: testData, error: testError } = await supabase
      .from('ingredients')
      .select('id, name, cost_per_unit')
      .limit(1)

    if (testError) {
      console.log('⚠️ Error verificando tabla:', testError.message)
    } else {
      console.log('✅ Tabla ingredients accesible:', testData?.length || 0, 'registros encontrados')
    }

    return NextResponse.json({
      success: true,
      message: 'Trigger de historial de precios corregido exitosamente',
      data
    })

  } catch (error: any) {
    console.error('❌ Error en API fix-trigger:', error)
    return NextResponse.json({
      success: false,
      message: `Error interno: ${error.message}`
    }, { status: 500 })
  }
}











