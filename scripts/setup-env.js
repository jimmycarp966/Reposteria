#!/usr/bin/env node

/**
 * Script para configurar variables de entorno
 * Ejecutar con: node scripts/setup-env.js
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function setupEnvironment() {
  console.log('🔧 Configuración de Variables de Entorno')
  console.log('=====================================\n')

  console.log('📋 Necesitas obtener estos valores de tu proyecto Supabase:')
  console.log('   1. Ve a https://supabase.com/dashboard')
  console.log('   2. Selecciona tu proyecto')
  console.log('   3. Ve a Settings > API')
  console.log('   4. Copia "Project URL" y "anon public" key\n')

  const supabaseUrl = await question('🌐 Supabase URL: ')
  const supabaseKey = await question('🔑 Supabase Anon Key: ')

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-') || supabaseKey.includes('your-')) {
    console.log('\n❌ Valores inválidos. Por favor, proporciona las credenciales reales de Supabase.')
    console.log('\n💡 Si no tienes un proyecto Supabase:')
    console.log('   1. Ve a https://supabase.com')
    console.log('   2. Crea una cuenta gratuita')
    console.log('   3. Crea un nuevo proyecto')
    console.log('   4. Ejecuta este script nuevamente')
    rl.close()
    return
  }

  const envContent = `# Configuración de Supabase
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}

# Optimizaciones para desarrollo
NEXT_TELEMETRY_DISABLED=1
NODE_OPTIONS="--max-old-space-size=4096"

# Configuración de caché
CACHE_TTL_MINUTES=5
`

  const envPath = path.join(process.cwd(), '.env.local')
  
  try {
    fs.writeFileSync(envPath, envContent)
    console.log('\n✅ Archivo .env.local creado exitosamente!')
    console.log('\n🚀 Ahora puedes ejecutar: npm run dev')
    console.log('   La aplicación debería conectarse a Supabase correctamente.')
  } catch (error) {
    console.log('\n❌ Error al crear .env.local:', error.message)
    console.log('\n💡 Crea manualmente el archivo .env.local con:')
    console.log(envContent)
  }

  rl.close()
}

setupEnvironment()
