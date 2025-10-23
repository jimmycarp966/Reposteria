// Script directo para eliminar la restricción de unicidad en recipe_ingredients
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

async function fixRecipeIngredients() {
  try {
    console.log('🔧 Eliminando restricción de unicidad en recipe_ingredients...');

    // Paso 1: Verificar restricciones existentes
    console.log('1. Verificando restricciones existentes...');
    
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'recipe_ingredients')
      .eq('constraint_type', 'UNIQUE');

    if (constraintError) {
      console.log('⚠️ No se pudo verificar restricciones:', constraintError.message);
    } else {
      console.log('📋 Restricciones encontradas:', constraints);
    }

    // Paso 2: Intentar eliminar la restricción usando SQL directo
    console.log('2. Intentando eliminar restricción...');
    
    // Usar una consulta SQL directa
    const { data: result, error: dropError } = await supabase
      .rpc('exec', { 
        sql: 'ALTER TABLE recipe_ingredients DROP CONSTRAINT IF EXISTS recipe_ingredients_recipe_id_ingredient_id_key;' 
      });

    if (dropError) {
      console.log('⚠️ Error eliminando restricción:', dropError.message);
      console.log('💡 Esto puede ser normal si la restricción ya no existe');
    } else {
      console.log('✅ Restricción eliminada exitosamente');
    }

    // Paso 3: Crear índice para rendimiento
    console.log('3. Creando índice para rendimiento...');
    
    const { error: indexError } = await supabase
      .rpc('exec', { 
        sql: 'CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_ingredient ON recipe_ingredients(recipe_id, ingredient_id);' 
      });

    if (indexError) {
      console.log('⚠️ Error creando índice:', indexError.message);
    } else {
      console.log('✅ Índice creado exitosamente');
    }

    // Paso 4: Verificar resultado final
    console.log('4. Verificando resultado final...');
    
    const { data: finalConstraints, error: finalError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'recipe_ingredients')
      .eq('constraint_type', 'UNIQUE');

    if (finalError) {
      console.log('⚠️ No se pudo verificar resultado final:', finalError.message);
    } else {
      const uniqueConstraints = finalConstraints?.filter(c => 
        c.constraint_name.includes('recipe_id') && c.constraint_name.includes('ingredient_id')
      ) || [];
      
      if (uniqueConstraints.length === 0) {
        console.log('🎉 ¡Éxito! Ya no hay restricción de unicidad en recipe_ingredients');
        console.log('✅ Ahora puedes agregar el mismo ingrediente múltiples veces a una receta');
      } else {
        console.log('⚠️ Aún existen restricciones de unicidad:', uniqueConstraints);
        console.log('💡 Puede que necesites aplicar la migración manualmente en Supabase');
      }
    }

    console.log('\n📝 Instrucciones manuales (si es necesario):');
    console.log('1. Ve a tu panel de Supabase');
    console.log('2. Abre el SQL Editor');
    console.log('3. Ejecuta este SQL:');
    console.log('   ALTER TABLE recipe_ingredients DROP CONSTRAINT IF EXISTS recipe_ingredients_recipe_id_ingredient_id_key;');
    console.log('4. Crea un índice:');
    console.log('   CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_ingredient ON recipe_ingredients(recipe_id, ingredient_id);');

  } catch (error) {
    console.log('❌ Error general:', error.message);
    console.log('Detalles:', error);
  }
}

fixRecipeIngredients();
