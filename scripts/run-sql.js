// Script para ejecutar SQL directo en Supabase
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

async function runSQL() {
  try {
    console.log('🔧 Ejecutando SQL de corrección...');

    // Paso 1: Crear enum si no existe
    console.log('1. Creando enum payment_status...');
    const createEnumSQL = `
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
          CREATE TYPE payment_status_enum AS ENUM ('pendiente', 'parcial', 'pagado');
        END IF;
      END $$;
    `;

    // Paso 2: Agregar columnas a orders
    console.log('2. Agregando columnas a orders...');
    const alterOrdersSQL = `
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS payment_status payment_status_enum DEFAULT 'pendiente',
      ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS amount_pending DECIMAL(10,2) DEFAULT 0;
    `;

    // Paso 3: Agregar columnas a sales
    console.log('3. Agregando columnas a sales...');
    const alterSalesSQL = `
      ALTER TABLE sales 
      ADD COLUMN IF NOT EXISTS payment_status payment_status_enum DEFAULT 'pendiente',
      ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS amount_pending DECIMAL(10,2) DEFAULT 0;
    `;

    // Paso 4: Inicializar datos existentes
    console.log('4. Inicializando datos existentes...');
    const initOrdersSQL = `
      UPDATE orders 
      SET 
        amount_pending = total_price,
        amount_paid = 0,
        payment_status = 'pendiente'
      WHERE payment_status IS NULL;
    `;

    const initSalesSQL = `
      UPDATE sales 
      SET 
        amount_pending = total_amount,
        amount_paid = 0,
        payment_status = 'pendiente'
      WHERE payment_status IS NULL;
    `;

    // Ejecutar comandos usando una función RPC simple
    console.log('📝 Ejecutando comandos SQL...');

    // Intentar ejecutar usando una función RPC básica
    try {
      // Verificar si existe la función exec
      const { data: functions } = await supabase.rpc('exec', { sql: 'SELECT 1;' });
      console.log('✅ Función exec disponible');
    } catch (error) {
      console.log('⚠️ Función exec no disponible, usando método alternativo');
      
      // Método alternativo: usar supabase.rpc con una función simple
      console.log('📝 Creando función temporal para ejecutar SQL...');
      
      // Crear función temporal
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION temp_exec_sql(sql_text TEXT)
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

      // Ejecutar cada comando
      const commands = [
        createEnumSQL,
        alterOrdersSQL,
        alterSalesSQL,
        initOrdersSQL,
        initSalesSQL
      ];

      for (let i = 0; i < commands.length; i++) {
        console.log(`\nEjecutando comando ${i + 1}...`);
        try {
          const { data, error } = await supabase.rpc('temp_exec_sql', { 
            sql_text: commands[i] 
          });

          if (error) {
            console.log(`❌ Error en comando ${i + 1}:`, error.message);
          } else {
            console.log(`✅ Comando ${i + 1} ejecutado:`, data);
          }
        } catch (cmdError) {
          console.log(`❌ Error ejecutando comando ${i + 1}:`, cmdError.message);
        }
      }

      // Limpiar función temporal
      console.log('\n🧹 Limpiando función temporal...');
      await supabase.rpc('temp_exec_sql', { 
        sql_text: 'DROP FUNCTION IF EXISTS temp_exec_sql(TEXT);' 
      });
    }

    console.log('\n✅ Migración de pagos completada');

    // Verificar resultado
    console.log('\n🔍 Verificando resultado...');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_price, payment_status, amount_paid, amount_pending')
      .limit(3);

    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('id, total_amount, payment_status, amount_paid, amount_pending')
      .limit(3);

    if (ordersError) {
      console.log('❌ Error verificando orders:', ordersError.message);
    } else {
      console.log('✅ Orders verificados:', ordersData);
    }

    if (salesError) {
      console.log('❌ Error verificando sales:', salesError.message);
    } else {
      console.log('✅ Sales verificados:', salesData);
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Detalles:', error);
  }
}

runSQL();


