// Script para aplicar la corrección de ingredientes duplicados en recetas
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

async function applyRecipeIngredientsFix() {
  try {
    console.log('🔧 Aplicando corrección para ingredientes duplicados en recetas...');

    // Leer la migración
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '008_remove_recipe_ingredients_unique_constraint.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Ejecutando migración SQL...');
    console.log('SQL:', migrationSQL);

    // Ejecutar la migración
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.log('❌ Error ejecutando migración:', error.message);
      return;
    }

    console.log('✅ Migración aplicada exitosamente');
    console.log('🎉 Ahora puedes agregar el mismo ingrediente múltiples veces a una receta');

    // Verificar que la restricción se eliminó
    console.log('🔍 Verificando que la restricción se eliminó...');
    
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name')
      .eq('table_name', 'recipe_ingredients')
      .eq('constraint_type', 'UNIQUE');

    if (constraintError) {
      console.log('⚠️ No se pudo verificar las restricciones:', constraintError.message);
    } else {
      const uniqueConstraints = constraints?.filter(c => 
        c.constraint_name.includes('recipe_id') && c.constraint_name.includes('ingredient_id')
      ) || [];
      
      if (uniqueConstraints.length === 0) {
        console.log('✅ Restricción de unicidad eliminada correctamente');
      } else {
        console.log('⚠️ Aún existen restricciones de unicidad:', uniqueConstraints);
      }
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Detalles:', error);
  }
}

applyRecipeIngredientsFix();
