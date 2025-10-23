// Script para verificar el esquema actual de la base de datos
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

async function checkSchema() {
  try {
    console.log('🔍 Verificando esquema de la base de datos...');

    // Verificar orders
    console.log('\n📋 Verificando tabla orders...');
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .limit(1);

      if (ordersError) {
        console.log('❌ Error accediendo a orders:', ordersError.message);
        console.log('Código:', ordersError.code);
        console.log('Detalles:', ordersError.details);
      } else {
        console.log('✅ Orders accesible');
        if (ordersData && ordersData.length > 0) {
          console.log('📊 Columnas disponibles en orders:', Object.keys(ordersData[0]));
        } else {
          console.log('📊 Tabla orders vacía');
        }
      }
    } catch (error) {
      console.log('❌ Error inesperado con orders:', error.message);
    }

    // Verificar sales
    console.log('\n📋 Verificando tabla sales...');
    try {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .limit(1);

      if (salesError) {
        console.log('❌ Error accediendo a sales:', salesError.message);
        console.log('Código:', salesError.code);
        console.log('Detalles:', salesError.details);
      } else {
        console.log('✅ Sales accesible');
        if (salesData && salesData.length > 0) {
          console.log('📊 Columnas disponibles en sales:', Object.keys(salesData[0]));
        } else {
          console.log('📊 Tabla sales vacía');
        }
      }
    } catch (error) {
      console.log('❌ Error inesperado con sales:', error.message);
    }

    // Verificar columnas específicas de pago
    console.log('\n💰 Verificando columnas de pago...');
    
    const paymentColumns = ['payment_status', 'amount_paid', 'amount_pending'];
    
    for (const column of paymentColumns) {
      console.log(`\n🔍 Verificando columna '${column}' en orders...`);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(column)
          .limit(1);

        if (error) {
          console.log(`❌ Columna '${column}' no existe en orders:`, error.message);
        } else {
          console.log(`✅ Columna '${column}' existe en orders`);
        }
      } catch (error) {
        console.log(`❌ Error verificando '${column}' en orders:`, error.message);
      }

      console.log(`🔍 Verificando columna '${column}' en sales...`);
      try {
        const { data, error } = await supabase
          .from('sales')
          .select(column)
          .limit(1);

        if (error) {
          console.log(`❌ Columna '${column}' no existe en sales:`, error.message);
        } else {
          console.log(`✅ Columna '${column}' existe en sales`);
        }
      } catch (error) {
        console.log(`❌ Error verificando '${column}' en sales:`, error.message);
      }
    }

    // Verificar tipos de datos
    console.log('\n📝 Verificando tipos de datos...');
    try {
      const { data: typesData, error: typesError } = await supabase
        .from('pg_type')
        .select('typname')
        .eq('typname', 'payment_status_enum');

      if (typesError) {
        console.log('❌ Error verificando tipos:', typesError.message);
      } else {
        if (typesData && typesData.length > 0) {
          console.log('✅ Tipo payment_status_enum existe');
        } else {
          console.log('❌ Tipo payment_status_enum no existe');
        }
      }
    } catch (error) {
      console.log('❌ Error verificando tipos:', error.message);
    }

  } catch (error) {
    console.log('❌ Error general:', error.message);
    console.log('Detalles:', error);
  }
}

checkSchema();


