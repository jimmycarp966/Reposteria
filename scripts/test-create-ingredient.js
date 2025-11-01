// Script para probar la creación de ingredientes directamente en Supabase
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

async function testIngredientCreation() {
  try {
    console.log('\n🧪 PROBANDO CREACIÓN DE INGREDIENTE DIRECTAMENTE EN SUPABASE...\n');

    // 1. Verificar conexión
    console.log('1️⃣ Verificando conexión a Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('ingredients')
      .select('id')
      .limit(1);

    if (testError) {
      console.log('❌ Error de conexión:', testError.message);
      console.log('   Código:', testError.code);
      console.log('   Detalles:', testError.details);
      console.log('   Hint:', testError.hint);
      return;
    }

    console.log('✅ Conexión exitosa\n');

    // 2. Intentar crear un ingrediente de prueba
    console.log('2️⃣ Intentando crear ingrediente de prueba...');
    const testIngredient = {
      name: `Ingrediente Test ${Date.now()}`,
      unit: 'gramos',
      cost_per_unit: 100.50,
      supplier: 'Proveedor Test'
    };

    console.log('   Datos a insertar:', testIngredient);

    const { data: insertedData, error: insertError } = await supabase
      .from('ingredients')
      .insert([testIngredient])
      .select()
      .single();

    if (insertError) {
      console.log('❌ ERROR AL INSERTAR:');
      console.log('   Mensaje:', insertError.message);
      console.log('   Código:', insertError.code);
      console.log('   Detalles:', insertError.details);
      console.log('   Hint:', insertError.hint);
      console.log('\n   Posibles causas:');
      console.log('   - RLS (Row Level Security) bloqueando la inserción');
      console.log('   - Campos requeridos faltantes');
      console.log('   - Problemas de permisos');
      console.log('   - Tabla no existe');
      return;
    }

    console.log('✅ Ingrediente creado exitosamente!');
    console.log('   ID:', insertedData.id);
    console.log('   Nombre:', insertedData.name);

    // 3. Verificar que se pueda leer
    console.log('\n3️⃣ Verificando que se pueda leer el ingrediente creado...');
    const { data: readData, error: readError } = await supabase
      .from('ingredients')
      .select('*')
      .eq('id', insertedData.id)
      .single();

    if (readError) {
      console.log('❌ Error al leer:', readError.message);
    } else {
      console.log('✅ Ingrediente leído correctamente:', readData.name);
    }

    // 4. Verificar si se puede crear inventory
    console.log('\n4️⃣ Intentando crear registro de inventory...');
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory')
      .insert([{
        ingredient_id: insertedData.id,
        quantity: 0,
        unit: 'gramos'
      }])
      .select()
      .single();

    if (inventoryError) {
      console.log('❌ Error al crear inventory:', inventoryError.message);
      console.log('   Código:', inventoryError.code);
      console.log('   Detalles:', inventoryError.details);
    } else {
      console.log('✅ Inventory creado exitosamente');
    }

    // 5. Limpiar - eliminar ingrediente de prueba
    console.log('\n5️⃣ Limpiando ingrediente de prueba...');
    const { error: deleteError } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', insertedData.id);

    if (deleteError) {
      console.log('⚠️  No se pudo eliminar el ingrediente de prueba:', deleteError.message);
    } else {
      console.log('✅ Ingrediente de prueba eliminado');
    }

    console.log('\n✅ PRUEBA COMPLETADA\n');
    console.log('💡 Si el ingrediente se creó exitosamente, el problema está en la aplicación.');
    console.log('💡 Si hubo errores, revisa las políticas RLS y la configuración de Supabase.\n');

  } catch (error) {
    console.log('❌ Error inesperado:', error);
  }
}

testIngredientCreation();

