// Script para corregir los datos de pago en Supabase
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

async function fixPaymentData() {
  try {
    console.log('🔧 Corrigiendo datos de pago...');

    // Paso 1: Verificar datos actuales
    console.log('1. Verificando datos actuales...');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_price, payment_status, amount_paid, amount_pending')
      .limit(10);

    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('id, total_amount, payment_status, amount_paid, amount_pending')
      .limit(10);

    if (ordersError) {
      console.log('❌ Error obteniendo orders:', ordersError.message);
      return;
    }

    if (salesError) {
      console.log('❌ Error obteniendo sales:', salesError.message);
      return;
    }

    console.log('📊 Orders encontrados:', ordersData?.length || 0);
    console.log('📊 Sales encontrados:', salesData?.length || 0);

    // Paso 2: Corregir orders
    console.log('2. Corrigiendo orders...');
    for (const order of ordersData || []) {
      const updates = {
        payment_status: 'pendiente',
        amount_paid: 0,
        amount_pending: order.total_price
      };

      // Si ya tiene datos de pago, mantenerlos pero asegurar consistencia
      if (order.payment_status && order.amount_paid !== null && order.amount_pending !== null) {
        if (order.amount_paid + order.amount_pending === order.total_price) {
          console.log(`✅ Order ${order.id} ya tiene datos consistentes`);
          continue;
        } else {
          // Corregir inconsistencia
          updates.amount_pending = order.total_price - (order.amount_paid || 0);
          updates.payment_status = order.amount_paid >= order.total_price ? 'pagado' : 
                                  order.amount_paid > 0 ? 'parcial' : 'pendiente';
        }
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', order.id);

      if (updateError) {
        console.log(`❌ Error actualizando order ${order.id}:`, updateError.message);
      } else {
        console.log(`✅ Order ${order.id} actualizado`);
      }
    }

    // Paso 3: Corregir sales
    console.log('3. Corrigiendo sales...');
    for (const sale of salesData || []) {
      const updates = {
        payment_status: 'pendiente',
        amount_paid: 0,
        amount_pending: sale.total_amount
      };

      // Si ya tiene datos de pago, mantenerlos pero asegurar consistencia
      if (sale.payment_status && sale.amount_paid !== null && sale.amount_pending !== null) {
        if (sale.amount_paid + sale.amount_pending === sale.total_amount) {
          console.log(`✅ Sale ${sale.id} ya tiene datos consistentes`);
          continue;
        } else {
          // Corregir inconsistencia
          updates.amount_pending = sale.total_amount - (sale.amount_paid || 0);
          updates.payment_status = sale.amount_paid >= sale.total_amount ? 'pagado' : 
                                  sale.amount_paid > 0 ? 'parcial' : 'pendiente';
        }
      }

      const { error: updateError } = await supabase
        .from('sales')
        .update(updates)
        .eq('id', sale.id);

      if (updateError) {
        console.log(`❌ Error actualizando sale ${sale.id}:`, updateError.message);
      } else {
        console.log(`✅ Sale ${sale.id} actualizado`);
      }
    }

    console.log('✅ Corrección de datos completada');

    // Paso 4: Verificar resultado
    console.log('4. Verificando resultado...');
    const { data: finalOrders } = await supabase
      .from('orders')
      .select('id, total_price, payment_status, amount_paid, amount_pending')
      .limit(5);

    const { data: finalSales } = await supabase
      .from('sales')
      .select('id, total_amount, payment_status, amount_paid, amount_pending')
      .limit(5);

    console.log('📊 Orders finales:', finalOrders);
    console.log('📊 Sales finales:', finalSales);

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Detalles:', error);
  }
}

fixPaymentData();


