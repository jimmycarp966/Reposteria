// Script para verificar la conexión a Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer archivo .env.local si existe
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

console.log('🔍 Verificando configuración de Supabase...');
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ No configurada');
console.log('Key:', supabaseAnonKey ? '✅ Configurada' : '❌ No configurada');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Variables de entorno no configuradas. Crea un archivo .env.local con:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=tu-supabase-project-url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-supabase-anon-key');
  process.exit(1);
}

if (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
  console.log('❌ Variables de entorno tienen valores placeholder. Configura correctamente.');
  process.exit(1);
}

console.log('🚀 Probando conexión...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Intentar una consulta simple
    const { data, error } = await supabase
      .from('recipes')
      .select('id, name')
      .limit(1);

    if (error) {
      console.log('❌ Error de conexión:', error.message);
      console.log('Código de error:', error.code);
      console.log('Detalles:', error.details);
      if (error.code === 'PGRST116') {
        console.log('💡 Posible causa: La tabla "recipes" no existe o no tienes permisos');
      }
      if (error.code === '42P01') {
        console.log('💡 Posible causa: La tabla "recipes" no existe en la base de datos');
      }
      return;
    }

    console.log('✅ Conexión exitosa a Supabase');
    console.log('📊 Datos de prueba obtenidos:', data);

  } catch (error) {
    console.log('❌ Error inesperado:', error.message);
  }
}

testConnection();
