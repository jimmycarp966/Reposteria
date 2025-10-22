// Script para verificar ingredientes existentes
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

async function checkIngredients() {
  const { data, error } = await supabase
    .from('ingredients')
    .select('id, name, unit, cost_per_unit')
    .order('name');

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log('📋 INGREDIENTES EXISTENTES:');
  console.log('==============================');
  data.forEach(ing => {
    console.log(`${ing.name} (${ing.unit}) - $${ing.cost_per_unit}`);
  });
  console.log('==============================');
  console.log(`Total: ${data.length} ingredientes`);

  return data;
}

checkIngredients();
