// Script para aplicar migración paso a paso
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

async function applyStepByStepMigration() {
  try {
    console.log('🔧 Aplicando migración paso a paso...');

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '007_fix_payment_constraints_step_by_step.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migración leída:', migrationPath);

    // Dividir el SQL en pasos individuales
    const steps = [
      // Paso 1: Crear ENUM
      `DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
    CREATE TYPE payment_status_enum AS ENUM ('pendiente', 'parcial', 'pagado');
  END IF;
END $$;`,

      // Paso 2: Agregar columnas a orders
      `DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
    ALTER TABLE orders ADD COLUMN payment_status payment_status_enum DEFAULT 'pendiente';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'amount_paid') THEN
    ALTER TABLE orders ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'amount_pending') THEN
    ALTER TABLE orders ADD COLUMN amount_pending DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;`,

      // Paso 3: Agregar columnas a sales
      `DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'sales' AND column_name = 'payment_status') THEN
    ALTER TABLE sales ADD COLUMN payment_status payment_status_enum DEFAULT 'pendiente';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'sales' AND column_name = 'amount_paid') THEN
    ALTER TABLE sales ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'sales' AND column_name = 'amount_pending') THEN
    ALTER TABLE sales ADD COLUMN amount_pending DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;`,

      // Paso 4: Inicializar datos existentes
      `UPDATE orders 
SET 
  amount_pending = total_price,
  amount_paid = 0,
  payment_status = 'pendiente'
WHERE payment_status IS NULL OR amount_paid IS NULL OR amount_pending IS NULL;`,

      `UPDATE sales 
SET 
  amount_pending = total_amount,
  amount_paid = 0,
  payment_status = 'pendiente'
WHERE payment_status IS NULL OR amount_paid IS NULL OR amount_pending IS NULL;`,

      // Paso 5: Corregir inconsistencias
      `UPDATE orders 
SET amount_pending = total_price - COALESCE(amount_paid, 0)
WHERE amount_paid + amount_pending != total_price;`,

      `UPDATE sales 
SET amount_pending = total_amount - COALESCE(amount_paid, 0)
WHERE amount_paid + amount_pending != total_amount;`,

      // Paso 6: Actualizar estados de pago
      `UPDATE orders 
SET payment_status = CASE 
  WHEN amount_paid = 0 THEN 'pendiente'
  WHEN amount_paid >= total_price THEN 'pagado'
  ELSE 'parcial'
END;`,

      `UPDATE sales 
SET payment_status = CASE 
  WHEN amount_paid = 0 THEN 'pendiente'
  WHEN amount_paid >= total_amount THEN 'pagado'
  ELSE 'parcial'
END;`
    ];

    // Ejecutar cada paso
    for (let i = 0; i < steps.length; i++) {
      console.log(`\n📝 Ejecutando paso ${i + 1}...`);
      
      try {
        // Usar una función RPC simple para ejecutar SQL
        const { data, error } = await supabase.rpc('exec', { 
          sql: steps[i] 
        });

        if (error) {
          console.log(`⚠️ Advertencia en paso ${i + 1}:`, error.message);
          // Continuar con el siguiente paso
        } else {
          console.log(`✅ Paso ${i + 1} ejecutado exitosamente`);
        }
      } catch (cmdError) {
        console.log(`❌ Error en paso ${i + 1}:`, cmdError.message);
        // Continuar con el siguiente paso
      }
    }

    console.log('\n✅ Migración paso a paso completada');

    // Verificar resultado
    console.log('\n🔍 Verificando resultado...');
    
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_price, payment_status, amount_paid, amount_pending')
        .limit(3);

      if (ordersError) {
        console.log('❌ Error verificando orders:', ordersError.message);
      } else {
        console.log('✅ Orders verificados:', ordersData);
      }
    } catch (error) {
      console.log('❌ Error verificando orders:', error.message);
    }

    try {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('id, total_amount, payment_status, amount_paid, amount_pending')
        .limit(3);

      if (salesError) {
        console.log('❌ Error verificando sales:', salesError.message);
      } else {
        console.log('✅ Sales verificados:', salesData);
      }
    } catch (error) {
      console.log('❌ Error verificando sales:', error.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Detalles:', error);
  }
}

applyStepByStepMigration();


