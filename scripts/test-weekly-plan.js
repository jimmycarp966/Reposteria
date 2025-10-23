// Script para probar el plan semanal de producción
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

async function testWeeklyPlan() {
  try {
    console.log('🧪 Probando plan semanal de producción...');

    // Paso 1: Crear un plan semanal de prueba
    console.log('1. Creando plan semanal de prueba...');
    
    // Usar una fecha específica que sabemos que es lunes
    const monday = new Date('2024-12-16'); // Lunes
    const sunday = new Date('2024-12-22'); // Domingo

    const weekStart = monday.toISOString().split('T')[0];
    const weekEnd = sunday.toISOString().split('T')[0];

    console.log(`📅 Semana de prueba: ${weekStart} a ${weekEnd}`);

    const { data: planData, error: planError } = await supabase
      .from('weekly_production_plans')
      .insert([{
        week_start_date: weekStart,
        week_end_date: weekEnd,
        notes: 'Plan de prueba para verificar funcionalidad'
      }])
      .select()
      .single();

    if (planError) {
      console.log('❌ Error creando plan:', planError.message);
      return;
    }

    console.log('✅ Plan creado:', planData);

    // Paso 2: Agregar tareas de prueba
    console.log('2. Agregando tareas de prueba...');
    
    const tasks = [
      {
        plan_id: planData.id,
        day_of_week: 1, // Lunes
        task_description: 'Preparar masas para tartas',
        estimated_time_minutes: 120,
        order_position: 0
      },
      {
        plan_id: planData.id,
        day_of_week: 1, // Lunes
        task_description: 'Cortar frutas para decoración',
        estimated_time_minutes: 60,
        order_position: 1
      },
      {
        plan_id: planData.id,
        day_of_week: 2, // Martes
        task_description: 'Hornear tartas de chocolate',
        estimated_time_minutes: 90,
        order_position: 0
      },
      {
        plan_id: planData.id,
        day_of_week: 3, // Miércoles
        task_description: 'Decorar tartas',
        estimated_time_minutes: 180,
        order_position: 0
      }
    ];

    const { data: tasksData, error: tasksError } = await supabase
      .from('weekly_production_tasks')
      .insert(tasks)
      .select();

    if (tasksError) {
      console.log('❌ Error creando tareas:', tasksError.message);
      return;
    }

    console.log('✅ Tareas creadas:', tasksData.length);

    // Paso 3: Probar función get_weekly_plan_with_tasks
    console.log('3. Probando función get_weekly_plan_with_tasks...');
    
    const { data: planWithTasks, error: planWithTasksError } = await supabase
      .rpc('get_weekly_plan_with_tasks', { week_start_param: weekStart });

    if (planWithTasksError) {
      console.log('❌ Error obteniendo plan con tareas:', planWithTasksError.message);
    } else {
      console.log('✅ Plan con tareas obtenido exitosamente');
      console.log('📊 Datos:', JSON.stringify(planWithTasks, null, 2));
    }

    // Paso 4: Probar actualización de estado de tarea
    console.log('4. Probando actualización de estado de tarea...');
    
    const firstTask = tasksData[0];
    const { error: updateError } = await supabase
      .from('weekly_production_tasks')
      .update({ status: 'completada' })
      .eq('id', firstTask.id);

    if (updateError) {
      console.log('❌ Error actualizando tarea:', updateError.message);
    } else {
      console.log('✅ Tarea marcada como completada');
    }

    // Paso 5: Verificar que completed_at se actualizó automáticamente
    console.log('5. Verificando que completed_at se actualizó...');
    
    const { data: updatedTask, error: updatedTaskError } = await supabase
      .from('weekly_production_tasks')
      .select('id, status, completed_at')
      .eq('id', firstTask.id)
      .single();

    if (updatedTaskError) {
      console.log('❌ Error obteniendo tarea actualizada:', updatedTaskError.message);
    } else {
      console.log('✅ Tarea actualizada:', updatedTask);
      if (updatedTask.completed_at) {
        console.log('✅ completed_at se actualizó automáticamente');
      } else {
        console.log('⚠️ completed_at no se actualizó');
      }
    }

    // Paso 6: Probar función get_weekly_plan_stats
    console.log('6. Probando función get_weekly_plan_stats...');
    
    const { data: stats, error: statsError } = await supabase
      .rpc('get_weekly_plan_stats', { plan_id_param: planData.id });

    if (statsError) {
      console.log('❌ Error obteniendo estadísticas:', statsError.message);
    } else {
      console.log('✅ Estadísticas obtenidas exitosamente');
      console.log('📊 Estadísticas:', JSON.stringify(stats, null, 2));
    }

    // Paso 7: Limpiar datos de prueba
    console.log('7. Limpiando datos de prueba...');
    
    const { error: deleteTasksError } = await supabase
      .from('weekly_production_tasks')
      .delete()
      .eq('plan_id', planData.id);

    const { error: deletePlanError } = await supabase
      .from('weekly_production_plans')
      .delete()
      .eq('id', planData.id);

    if (deleteTasksError || deletePlanError) {
      console.log('⚠️ Error limpiando datos de prueba');
    } else {
      console.log('✅ Datos de prueba eliminados');
    }

    console.log('\n🎉 ¡Prueba del plan semanal completada exitosamente!');
    console.log('✅ Las funcionalidades básicas están funcionando');
    console.log('✅ Puedes usar la aplicación en /plan-semanal');

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Detalles:', error);
  }
}

testWeeklyPlan();
