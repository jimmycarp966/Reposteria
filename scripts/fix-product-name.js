// Script para corregir el nombre del producto
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

async function fixProductName() {
  console.log('🔧 Corrigiendo nombre del producto...');

  const { error } = await supabase
    .from('products')
    .update({ name: 'Tarta de Camila' })
    .eq('name', 'Tarta Tarta de Camila');

  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Nombre corregido a "Tarta de Camila"');
  }

  // Verificar el resultado
  const { data } = await supabase
    .from('products')
    .select('name, suggested_price_cache')
    .eq('name', 'Tarta de Camila')
    .single();

  if (data) {
    console.log(`📦 Producto final: ${data.name} - $${data.suggested_price_cache}`);
  }
}

fixProductName();
