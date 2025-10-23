// Script para verificar las tareas de producción
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function testProductionTasks() {
  console.log('🔍 Verificando tareas de producción...\n');

  try {
    // Leer variables de entorno del archivo .env.local
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
      console.log('❌ Variables de entorno de Supabase no configuradas');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Verificar que la tabla existe y tiene datos
    console.log('📊 Consultando tareas de producción...');

    const { data: tasks, error } = await supabase
      .from("production_tasks")
      .select(`
        id,
        task_name,
        status,
        duration_minutes,
        order_item:order_items (
          product:products (
            name
          ),
          order:orders (
            delivery_date,
            delivery_time,
            status
          )
        )
      `)
      .order("start_time", { ascending: true })
      .limit(5); // Solo las primeras 5 para testing

    if (error) {
      console.log('❌ Error al consultar tareas:', error.message);
      return;
    }

    console.log(`✅ Encontradas ${tasks.length} tareas de producción`);
    console.log('');

    if (tasks.length > 0) {
      console.log('📋 Muestra de tareas:');
      tasks.forEach((task, index) => {
        const productName = task.order_item?.product?.name || 'Sin producto';
        const orderStatus = task.order_item?.order?.status || 'Sin orden';
        const deliveryDate = task.order_item?.order?.delivery_date || 'Sin fecha';

        console.log(`${index + 1}. ${task.task_name}`);
        console.log(`   - Estado: ${task.status}`);
        console.log(`   - Producto: ${productName}`);
        console.log(`   - Orden: ${orderStatus}`);
        console.log(`   - Entrega: ${deliveryDate}`);
        console.log(`   - Duración: ${task.duration_minutes} min`);
        console.log('');
      });
    } else {
      console.log('ℹ️ No hay tareas de producción actualmente');
      console.log('💡 Para crear tareas, confirma algunos pedidos primero');
    }

  } catch (error) {
    console.log('❌ Error en el test:', error.message);
  }
}

testProductionTasks();
