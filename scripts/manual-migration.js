// Script para aplicar migración manualmente usando el cliente de Supabase
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

async function manualMigration() {
  try {
    console.log('🔧 Aplicando migración manual de pagos...');

    // Paso 1: Verificar estructura actual
    console.log('1. Verificando estructura actual...');
    
    try {
      const { data: ordersStructure } = await supabase
        .from('orders')
        .select('*')
        .limit(1);
      console.log('✅ Tabla orders existe');
    } catch (error) {
      console.log('❌ Error accediendo a orders:', error.message);
      return;
    }

    try {
      const { data: salesStructure } = await supabase
        .from('sales')
        .select('*')
        .limit(1);
      console.log('✅ Tabla sales existe');
    } catch (error) {
      console.log('❌ Error accediendo a sales:', error.message);
      return;
    }

    // Paso 2: Verificar si las columnas ya existen
    console.log('2. Verificando columnas de pago...');
    
    let ordersHasPaymentColumns = false;
    let salesHasPaymentColumns = false;

    try {
      const { data: testOrders } = await supabase
        .from('orders')
        .select('payment_status, amount_paid, amount_pending')
        .limit(1);
      ordersHasPaymentColumns = true;
      console.log('✅ Orders ya tiene columnas de pago');
    } catch (error) {
      console.log('⚠️ Orders no tiene columnas de pago aún');
    }

    try {
      const { data: testSales } = await supabase
        .from('sales')
        .select('payment_status, amount_paid, amount_pending')
        .limit(1);
      salesHasPaymentColumns = true;
      console.log('✅ Sales ya tiene columnas de pago');
    } catch (error) {
      console.log('⚠️ Sales no tiene columnas de pago aún');
    }

    if (ordersHasPaymentColumns && salesHasPaymentColumns) {
      console.log('✅ Las columnas de pago ya existen. Solo necesitamos corregir los datos.');
      
      // Corregir datos existentes
      console.log('3. Corrigiendo datos existentes...');
      
      // Obtener todos los orders
      const { data: allOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_price, payment_status, amount_paid, amount_pending');

      if (ordersError) {
        console.log('❌ Error obteniendo orders:', ordersError.message);
        return;
      }

      console.log(`📊 Encontrados ${allOrders?.length || 0} orders`);

      // Corregir cada order
      for (const order of allOrders || []) {
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

      // Obtener todos los sales
      const { data: allSales, error: salesError } = await supabase
        .from('sales')
        .select('id, total_amount, payment_status, amount_paid, amount_pending');

      if (salesError) {
        console.log('❌ Error obteniendo sales:', salesError.message);
        return;
      }

      console.log(`📊 Encontrados ${allSales?.length || 0} sales`);

      // Corregir cada sale
      for (const sale of allSales || []) {
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

    } else {
      console.log('❌ Las columnas de pago no existen. Necesitas aplicar la migración manualmente en Supabase.');
      console.log('📝 Instrucciones:');
      console.log('1. Ve a tu proyecto de Supabase');
      console.log('2. Abre el SQL Editor');
      console.log('3. Ejecuta el contenido del archivo: supabase/migrations/004_payment_status.sql');
      console.log('4. Luego ejecuta este script nuevamente');
      return;
    }

    // Verificar resultado final
    console.log('4. Verificando resultado final...');
    const { data: finalOrders } = await supabase
      .from('orders')
      .select('id, total_price, payment_status, amount_paid, amount_pending')
      .limit(3);

    const { data: finalSales } = await supabase
      .from('sales')
      .select('id, total_amount, payment_status, amount_paid, amount_pending')
      .limit(3);

    console.log('📊 Orders finales:', finalOrders);
    console.log('📊 Sales finales:', finalSales);

    console.log('\n✅ Migración manual completada exitosamente');

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Detalles:', error);
  }
}

manualMigration();


