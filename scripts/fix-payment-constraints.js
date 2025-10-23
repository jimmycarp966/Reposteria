// Script para corregir los constraints de pago en Supabase
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

async function fixPaymentConstraints() {
  try {
    console.log('🔧 Corrigiendo constraints de pago...');

    // Paso 1: Eliminar constraints existentes
    console.log('1. Eliminando constraints existentes...');
    await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_order_payment_amounts;' 
    });
    await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE sales DROP CONSTRAINT IF EXISTS check_sale_payment_amounts;' 
    });

    // Paso 2: Corregir datos de orders
    console.log('2. Corrigiendo datos de orders...');
    await supabase.rpc('exec_sql', { 
      sql: `
        UPDATE orders 
        SET 
          payment_status = 'pendiente',
          amount_paid = 0,
          amount_pending = total_price
        WHERE payment_status IS NULL 
           OR amount_paid IS NULL 
           OR amount_pending IS NULL;
      ` 
    });

    // Paso 3: Corregir datos de sales
    console.log('3. Corrigiendo datos de sales...');
    await supabase.rpc('exec_sql', { 
      sql: `
        UPDATE sales 
        SET 
          payment_status = 'pendiente',
          amount_paid = 0,
          amount_pending = total_amount
        WHERE payment_status IS NULL 
           OR amount_paid IS NULL 
           OR amount_pending IS NULL;
      ` 
    });

    // Paso 4: Asegurar que amount_pending = total - amount_paid
    console.log('4. Ajustando montos pendientes...');
    await supabase.rpc('exec_sql', { 
      sql: `
        UPDATE orders 
        SET amount_pending = total_price - COALESCE(amount_paid, 0)
        WHERE amount_paid + amount_pending != total_price;
      ` 
    });

    await supabase.rpc('exec_sql', { 
      sql: `
        UPDATE sales 
        SET amount_pending = total_amount - COALESCE(amount_paid, 0)
        WHERE amount_paid + amount_pending != total_amount;
      ` 
    });

    // Paso 5: Actualizar payment_status basado en montos
    console.log('5. Actualizando estados de pago...');
    await supabase.rpc('exec_sql', { 
      sql: `
        UPDATE orders 
        SET payment_status = CASE 
          WHEN amount_paid = 0 THEN 'pendiente'
          WHEN amount_paid >= total_price THEN 'pagado'
          ELSE 'parcial'
        END;
      ` 
    });

    await supabase.rpc('exec_sql', { 
      sql: `
        UPDATE sales 
        SET payment_status = CASE 
          WHEN amount_paid = 0 THEN 'pendiente'
          WHEN amount_paid >= total_amount THEN 'pagado'
          ELSE 'parcial'
        END;
      ` 
    });

    // Paso 6: Agregar constraints de nuevo
    console.log('6. Agregando constraints de nuevo...');
    await supabase.rpc('exec_sql', { 
      sql: `
        ALTER TABLE orders 
        ADD CONSTRAINT check_order_payment_amounts 
        CHECK (amount_paid + amount_pending = total_price);
      ` 
    });

    await supabase.rpc('exec_sql', { 
      sql: `
        ALTER TABLE sales 
        ADD CONSTRAINT check_sale_payment_amounts 
        CHECK (amount_paid + amount_pending = total_amount);
      ` 
    });

    // Paso 7: Agregar NOT NULL constraints
    console.log('7. Agregando NOT NULL constraints...');
    await supabase.rpc('exec_sql', { 
      sql: `
        ALTER TABLE orders 
        ALTER COLUMN payment_status SET NOT NULL,
        ALTER COLUMN amount_paid SET NOT NULL,
        ALTER COLUMN amount_pending SET NOT NULL;
      ` 
    });

    await supabase.rpc('exec_sql', { 
      sql: `
        ALTER TABLE sales 
        ALTER COLUMN payment_status SET NOT NULL,
        ALTER COLUMN amount_paid SET NOT NULL,
        ALTER COLUMN amount_pending SET NOT NULL;
      ` 
    });

    console.log('✅ Constraints de pago corregidos exitosamente');

    // Verificar que todo está correcto
    console.log('8. Verificando datos...');
    const { data: ordersCheck } = await supabase
      .from('orders')
      .select('id, total_price, amount_paid, amount_pending, payment_status')
      .limit(5);

    const { data: salesCheck } = await supabase
      .from('sales')
      .select('id, total_amount, amount_paid, amount_pending, payment_status')
      .limit(5);

    console.log('📊 Muestra de orders:', ordersCheck);
    console.log('📊 Muestra de sales:', salesCheck);

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Detalles:', error);
  }
}

fixPaymentConstraints();


