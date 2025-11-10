// Script para verificar pedidos existentes
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

async function checkOrders() {
  const { data, error, count } = await supabase
    .from('orders')
    .select('id, delivery_date, status, type')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log('📋 PEDIDOS EXISTENTES:');
  console.log('==============================');
  data.slice(0, 5).forEach(order => { // Mostrar solo los primeros 5 para no llenar la pantalla
    console.log(`${order.type} - ${order.delivery_date} (${order.status}) - ID: ${order.id}`);
  });
  if (data.length > 5) {
    console.log(`... y ${data.length - 5} pedidos más`);
  }
  console.log('==============================');
  console.log(`Total: ${data.length} pedidos`);
}

checkOrders();
