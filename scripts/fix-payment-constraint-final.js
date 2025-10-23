// Script final para corregir el constraint de pagos
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

async function fixPaymentConstraintFinal() {
  try {
    console.log('🔧 Solución final para constraint de pagos...');

    // Paso 1: Verificar estado actual
    console.log('1. Verificando estado actual...');
    
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_price, payment_status, amount_paid, amount_pending')
        .limit(5);

      if (ordersError) {
        console.log('❌ Las columnas de pago no existen aún en orders:', ordersError.message);
        console.log('💡 Necesitas aplicar la migración manualmente en Supabase primero');
        console.log('\n📝 INSTRUCCIONES:');
        console.log('1. Ve a tu proyecto de Supabase');
        console.log('2. Abre el SQL Editor');
        console.log('3. Ejecuta el contenido del archivo: supabase/migrations/007_fix_payment_constraints_step_by_step.sql');
        console.log('4. Luego ejecuta este script nuevamente');
        return;
      } else {
        console.log('✅ Las columnas de pago existen en orders');
        console.log('📊 Muestra de orders:', ordersData);
      }
    } catch (error) {
      console.log('❌ Error verificando orders:', error.message);
      return;
    }

    try {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('id, total_amount, payment_status, amount_paid, amount_pending')
        .limit(5);

      if (salesError) {
        console.log('❌ Las columnas de pago no existen aún en sales:', salesError.message);
        console.log('💡 Necesitas aplicar la migración manualmente en Supabase primero');
        return;
      } else {
        console.log('✅ Las columnas de pago existen en sales');
        console.log('📊 Muestra de sales:', salesData);
      }
    } catch (error) {
      console.log('❌ Error verificando sales:', error.message);
      return;
    }

    // Paso 2: Identificar registros problemáticos
    console.log('\n2. Identificando registros problemáticos...');
    
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_price, payment_status, amount_paid, amount_pending');

    const { data: allSales, error: salesError } = await supabase
      .from('sales')
      .select('id, total_amount, payment_status, amount_paid, amount_pending');

    if (ordersError) {
      console.log('❌ Error obteniendo orders:', ordersError.message);
      return;
    }

    if (salesError) {
      console.log('❌ Error obteniendo sales:', salesError.message);
      return;
    }

    // Identificar orders problemáticos
    const problematicOrders = (allOrders || []).filter(order => {
      const total = parseFloat(order.total_price) || 0;
      const paid = parseFloat(order.amount_paid) || 0;
      const pending = parseFloat(order.amount_pending) || 0;
      return Math.abs((paid + pending) - total) > 0.01; // Tolerancia de 1 centavo
    });

    // Identificar sales problemáticos
    const problematicSales = (allSales || []).filter(sale => {
      const total = parseFloat(sale.total_amount) || 0;
      const paid = parseFloat(sale.amount_paid) || 0;
      const pending = parseFloat(sale.amount_pending) || 0;
      return Math.abs((paid + pending) - total) > 0.01; // Tolerancia de 1 centavo
    });

    console.log(`📊 Total orders: ${allOrders?.length || 0}`);
    console.log(`📊 Total sales: ${allSales?.length || 0}`);
    console.log(`⚠️ Orders problemáticos: ${problematicOrders.length}`);
    console.log(`⚠️ Sales problemáticos: ${problematicSales.length}`);

    if (problematicOrders.length > 0) {
      console.log('\n📋 Orders problemáticos:');
      problematicOrders.forEach(order => {
        const total = parseFloat(order.total_price) || 0;
        const paid = parseFloat(order.amount_paid) || 0;
        const pending = parseFloat(order.amount_pending) || 0;
        console.log(`  - Order ${order.id}: total=${total}, paid=${paid}, pending=${pending}, suma=${paid + pending}`);
      });
    }

    if (problematicSales.length > 0) {
      console.log('\n📋 Sales problemáticos:');
      problematicSales.forEach(sale => {
        const total = parseFloat(sale.total_amount) || 0;
        const paid = parseFloat(sale.amount_paid) || 0;
        const pending = parseFloat(sale.amount_pending) || 0;
        console.log(`  - Sale ${sale.id}: total=${total}, paid=${paid}, pending=${pending}, suma=${paid + pending}`);
      });
    }

    // Paso 3: Corregir orders problemáticos
    if (problematicOrders.length > 0) {
      console.log('\n3. Corrigiendo orders problemáticos...');
      
      for (const order of problematicOrders) {
        const total = parseFloat(order.total_price) || 0;
        const paid = parseFloat(order.amount_paid) || 0;
        
        // Ajustar amount_pending para que sea consistente
        const correctedPending = total - paid;
        
        const updates = {
          amount_pending: correctedPending,
          payment_status: paid >= total ? 'pagado' : (paid > 0 ? 'parcial' : 'pendiente')
        };

        console.log(`  Corrigiendo order ${order.id}: pending=${correctedPending}, status=${updates.payment_status}`);

        const { error: updateError } = await supabase
          .from('orders')
          .update(updates)
          .eq('id', order.id);

        if (updateError) {
          console.log(`❌ Error actualizando order ${order.id}:`, updateError.message);
        } else {
          console.log(`✅ Order ${order.id} corregido`);
        }
      }
    }

    // Paso 4: Corregir sales problemáticos
    if (problematicSales.length > 0) {
      console.log('\n4. Corrigiendo sales problemáticos...');
      
      for (const sale of problematicSales) {
        const total = parseFloat(sale.total_amount) || 0;
        const paid = parseFloat(sale.amount_paid) || 0;
        
        // Ajustar amount_pending para que sea consistente
        const correctedPending = total - paid;
        
        const updates = {
          amount_pending: correctedPending,
          payment_status: paid >= total ? 'pagado' : (paid > 0 ? 'parcial' : 'pendiente')
        };

        console.log(`  Corrigiendo sale ${sale.id}: pending=${correctedPending}, status=${updates.payment_status}`);

        const { error: updateError } = await supabase
          .from('sales')
          .update(updates)
          .eq('id', sale.id);

        if (updateError) {
          console.log(`❌ Error actualizando sale ${sale.id}:`, updateError.message);
        } else {
          console.log(`✅ Sale ${sale.id} corregido`);
        }
      }
    }

    // Paso 5: Verificar que todos los datos están correctos
    console.log('\n5. Verificando corrección...');
    
    const { data: finalOrders } = await supabase
      .from('orders')
      .select('id, total_price, payment_status, amount_paid, amount_pending');

    const { data: finalSales } = await supabase
      .from('sales')
      .select('id, total_amount, payment_status, amount_paid, amount_pending');

    // Verificar orders
    const remainingProblematicOrders = (finalOrders || []).filter(order => {
      const total = parseFloat(order.total_price) || 0;
      const paid = parseFloat(order.amount_paid) || 0;
      const pending = parseFloat(order.amount_pending) || 0;
      return Math.abs((paid + pending) - total) > 0.01;
    });

    // Verificar sales
    const remainingProblematicSales = (finalSales || []).filter(sale => {
      const total = parseFloat(sale.total_amount) || 0;
      const paid = parseFloat(sale.amount_paid) || 0;
      const pending = parseFloat(sale.amount_pending) || 0;
      return Math.abs((paid + pending) - total) > 0.01;
    });

    if (remainingProblematicOrders.length === 0 && remainingProblematicSales.length === 0) {
      console.log('✅ Todos los datos están correctos');
      console.log('📊 Muestra de orders corregidos:', finalOrders?.slice(0, 3));
      console.log('📊 Muestra de sales corregidos:', finalSales?.slice(0, 3));
      
      console.log('\n🎉 ¡Éxito! Ahora puedes:');
      console.log('1. Ejecutar: npm run build');
      console.log('2. Hacer deploy en Vercel');
      console.log('3. Usar las nuevas funcionalidades de pagos');
    } else {
      console.log(`❌ Aún hay ${remainingProblematicOrders.length} orders y ${remainingProblematicSales.length} sales problemáticos`);
      console.log('💡 Ejecuta este script nuevamente para corregir los restantes');
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Detalles:', error);
  }
}

fixPaymentConstraintFinal();


