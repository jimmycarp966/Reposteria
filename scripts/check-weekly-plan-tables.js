// Script para verificar las tablas del plan semanal
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

async function checkWeeklyPlanTables() {
  try {
    console.log('🔍 Verificando tablas del plan semanal...');

    // Verificar weekly_production_plans
    console.log('\n📋 Verificando tabla weekly_production_plans...');
    try {
      const { data: plansData, error: plansError } = await supabase
        .from('weekly_production_plans')
        .select('*')
        .limit(1);

      if (plansError) {
        console.log('❌ Error accediendo a weekly_production_plans:', plansError.message);
        console.log('Código:', plansError.code);
        console.log('Detalles:', plansError.details);
      } else {
        console.log('✅ weekly_production_plans accesible');
        if (plansData && plansData.length > 0) {
          console.log('📊 Columnas disponibles en weekly_production_plans:', Object.keys(plansData[0]));
        } else {
          console.log('📊 Tabla weekly_production_plans vacía');
        }
      }
    } catch (error) {
      console.log('❌ Error inesperado con weekly_production_plans:', error.message);
    }

    // Verificar weekly_production_tasks
    console.log('\n📋 Verificando tabla weekly_production_tasks...');
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('weekly_production_tasks')
        .select('*')
        .limit(1);

      if (tasksError) {
        console.log('❌ Error accediendo a weekly_production_tasks:', tasksError.message);
        console.log('Código:', tasksError.code);
        console.log('Detalles:', tasksError.details);
      } else {
        console.log('✅ weekly_production_tasks accesible');
        if (tasksData && tasksData.length > 0) {
          console.log('📊 Columnas disponibles en weekly_production_tasks:', Object.keys(tasksData[0]));
        } else {
          console.log('📊 Tabla weekly_production_tasks vacía');
        }
      }
    } catch (error) {
      console.log('❌ Error inesperado con weekly_production_tasks:', error.message);
    }

    // Verificar columnas específicas
    console.log('\n🔍 Verificando columnas específicas...');
    
    const planColumns = ['id', 'week_start_date', 'week_end_date', 'notes', 'created_at'];
    const taskColumns = ['id', 'plan_id', 'day_of_week', 'task_description', 'recipe_id', 'estimated_time_minutes', 'status', 'completed_at', 'order_position', 'created_at'];
    
    console.log('\n📋 Verificando columnas de weekly_production_plans...');
    for (const column of planColumns) {
      try {
        const { data, error } = await supabase
          .from('weekly_production_plans')
          .select(column)
          .limit(1);

        if (error) {
          console.log(`❌ Columna '${column}' no existe en weekly_production_plans:`, error.message);
        } else {
          console.log(`✅ Columna '${column}' existe en weekly_production_plans`);
        }
      } catch (error) {
        console.log(`❌ Error verificando '${column}' en weekly_production_plans:`, error.message);
      }
    }

    console.log('\n📋 Verificando columnas de weekly_production_tasks...');
    for (const column of taskColumns) {
      try {
        const { data, error } = await supabase
          .from('weekly_production_tasks')
          .select(column)
          .limit(1);

        if (error) {
          console.log(`❌ Columna '${column}' no existe en weekly_production_tasks:`, error.message);
        } else {
          console.log(`✅ Columna '${column}' existe en weekly_production_tasks`);
        }
      } catch (error) {
        console.log(`❌ Error verificando '${column}' en weekly_production_tasks:`, error.message);
      }
    }

    // Verificar funciones RPC
    console.log('\n🔧 Verificando funciones RPC...');
    
    const rpcFunctions = [
      'get_weekly_plan_with_tasks',
      'duplicate_weekly_plan',
      'get_weekly_plan_stats'
    ];

    for (const func of rpcFunctions) {
      try {
        const { data, error } = await supabase.rpc(func, { week_start_param: '2024-12-16' });
        
        if (error) {
          console.log(`❌ Función '${func}' no existe o tiene error:`, error.message);
        } else {
          console.log(`✅ Función '${func}' existe y funciona`);
        }
      } catch (error) {
        console.log(`❌ Error verificando función '${func}':`, error.message);
      }
    }

  } catch (error) {
    console.log('❌ Error general:', error.message);
    console.log('Detalles:', error);
  }
}

checkWeeklyPlanTables();


