// Script para aplicar la migración de pagos en Supabase
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

async function applyPaymentMigration() {
  try {
    console.log('🔧 Aplicando migración de pagos...');

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '004_payment_status.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migración leída:', migrationPath);

    // Dividir el SQL en comandos individuales
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Ejecutando ${commands.length} comandos...`);

    // Ejecutar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        console.log(`\n${i + 1}. Ejecutando: ${command.substring(0, 50)}...`);
        
        try {
          // Usar rpc para ejecutar SQL directo
          const { data, error } = await supabase.rpc('exec', { 
            sql: command + ';' 
          });

          if (error) {
            console.log(`⚠️ Advertencia en comando ${i + 1}:`, error.message);
            // Continuar con el siguiente comando
          } else {
            console.log(`✅ Comando ${i + 1} ejecutado exitosamente`);
          }
        } catch (cmdError) {
          console.log(`❌ Error en comando ${i + 1}:`, cmdError.message);
          // Continuar con el siguiente comando
        }
      }
    }

    console.log('\n✅ Migración de pagos aplicada');

    // Verificar que las columnas se crearon
    console.log('\n🔍 Verificando columnas creadas...');
    
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_price, payment_status, amount_paid, amount_pending')
        .limit(1);

      if (ordersError) {
        console.log('❌ Error verificando orders:', ordersError.message);
      } else {
        console.log('✅ Columnas de pago en orders creadas correctamente');
      }
    } catch (error) {
      console.log('❌ Error verificando orders:', error.message);
    }

    try {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('id, total_amount, payment_status, amount_paid, amount_pending')
        .limit(1);

      if (salesError) {
        console.log('❌ Error verificando sales:', salesError.message);
      } else {
        console.log('✅ Columnas de pago en sales creadas correctamente');
      }
    } catch (error) {
      console.log('❌ Error verificando sales:', error.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Detalles:', error);
  }
}

applyPaymentMigration();


