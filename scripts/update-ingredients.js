// Script para actualizar precios de ingredientes y crear nuevos
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer credenciales
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
  console.log('Error leyendo .env.local');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Credenciales no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Precios actualizados
const priceUpdates = [
  { name: 'Azúcar', newPrice: 800 }, // era $280
  { name: 'Huevos', newPrice: 200 }, // $6000/30 unidades
  { name: 'Harina 000', newPrice: 1500 }, // era $350
  { name: 'Crema de leche', newPrice: 2500 }, // era $850
];

// Nuevos ingredientes a crear
const newIngredients = [
  { name: 'Margarina', unit: 'kg', cost_per_unit: 3500 },
  { name: 'Dulce de leche', unit: 'kg', cost_per_unit: 3500 },
  { name: 'Coco rallado', unit: 'paquete', cost_per_unit: 1500 }, // paquete de 100g
];

async function updatePrices() {
  console.log('🔄 ACTUALIZANDO PRECIOS EXISTENTES...');

  for (const update of priceUpdates) {
    const { error } = await supabase
      .from('ingredients')
      .update({ cost_per_unit: update.newPrice })
      .eq('name', update.name);

    if (error) {
      console.log(`❌ Error actualizando ${update.name}:`, error.message);
    } else {
      console.log(`✅ ${update.name}: $${update.newPrice}`);
    }
  }
}

async function createNewIngredients() {
  console.log('\n🆕 CREANDO NUEVOS INGREDIENTES...');

  for (const ingredient of newIngredients) {
    const { error } = await supabase
      .from('ingredients')
      .insert([ingredient]);

    if (error) {
      console.log(`❌ Error creando ${ingredient.name}:`, error.message);
    } else {
      console.log(`✅ ${ingredient.name} (${ingredient.unit}): $${ingredient.cost_per_unit}`);
    }
  }
}

async function verifyAllIngredients() {
  console.log('\n📋 VERIFICANDO TODOS LOS INGREDIENTES...');

  const { data, error } = await supabase
    .from('ingredients')
    .select('name, unit, cost_per_unit')
    .order('name');

  if (error) {
    console.log('❌ Error verificando:', error.message);
    return;
  }

  console.log('==============================');
  data.forEach(ing => {
    console.log(`${ing.name} (${ing.unit}) - $${ing.cost_per_unit}`);
  });
  console.log('==============================');
  console.log(`Total: ${data.length} ingredientes`);
}

async function main() {
  await updatePrices();
  await createNewIngredients();
  await verifyAllIngredients();
  console.log('\n🎉 ¡INGREDIENTES LISTOS PARA LA RECETA!');
}

main();
