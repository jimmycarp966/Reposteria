#!/usr/bin/env node

/**
 * Script para aplicar la migración de historial de precios
 * Ejecuta la migración SQL en Supabase
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migración de historial de precios...')
    
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20241225_price_history.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Archivo de migración encontrado:', migrationPath)
    
    // Ejecutar la migración
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })
    
    if (error) {
      console.error('❌ Error al ejecutar migración:', error)
      process.exit(1)
    }
    
    console.log('✅ Migración aplicada exitosamente!')
    console.log('📊 Tablas creadas:')
    console.log('   - product_price_history')
    console.log('   - ingredient_price_history')
    console.log('🔧 Funciones creadas:')
    console.log('   - log_product_price_change()')
    console.log('   - log_ingredient_price_change()')
    console.log('   - get_product_price_history()')
    console.log('   - get_ingredient_price_history()')
    console.log('⚡ Triggers creados:')
    console.log('   - trigger_log_product_price_change')
    console.log('   - trigger_log_ingredient_price_change')
    
    // Verificar que las tablas se crearon correctamente
    console.log('\n🔍 Verificando tablas...')
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['product_price_history', 'ingredient_price_history'])
      .eq('table_schema', 'public')
    
    if (tablesError) {
      console.error('❌ Error al verificar tablas:', tablesError)
    } else {
      console.log('✅ Tablas verificadas:', tables?.map(t => t.table_name).join(', '))
    }
    
    console.log('\n🎉 ¡Sistema de historial de precios listo para usar!')
    console.log('💡 Ahora puedes:')
    console.log('   1. Cambiar precios de productos/ingredientes')
    console.log('   2. Ver el historial automáticamente registrado')
    console.log('   3. Usar los botones "Historial" en las tablas')
    
  } catch (error) {
    console.error('❌ Error inesperado:', error)
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  applyMigration()
}

module.exports = { applyMigration }
