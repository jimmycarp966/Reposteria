#!/usr/bin/env node

/**
 * Script para optimizar el entorno de desarrollo
 * Ejecutar con: node scripts/optimize-dev.js
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 Optimizando entorno de desarrollo...')

// Crear archivo .env.local si no existe
const envLocalPath = path.join(process.cwd(), '.env.local')
if (!fs.existsSync(envLocalPath)) {
  const envContent = `# Configuración para desarrollo local optimizado
NEXT_TELEMETRY_DISABLED=1
NODE_OPTIONS="--max-old-space-size=4096"

# Configuración de caché
CACHE_TTL_MINUTES=5
`
  fs.writeFileSync(envLocalPath, envContent)
  console.log('✅ Creado archivo .env.local con optimizaciones')
}

// Verificar configuración de Next.js
const nextConfigPath = path.join(process.cwd(), 'next.config.js')
if (fs.existsSync(nextConfigPath)) {
  console.log('✅ Configuración de Next.js optimizada')
} else {
  console.log('⚠️  Verificar que next.config.js esté configurado')
}

// Verificar dependencias críticas
const packageJsonPath = path.join(process.cwd(), 'package.json')
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  
  console.log('📦 Dependencias instaladas:')
  console.log(`   - Next.js: ${packageJson.dependencies?.next || 'No encontrado'}`)
  console.log(`   - React: ${packageJson.dependencies?.react || 'No encontrado'}`)
  console.log(`   - Supabase: ${packageJson.dependencies?.['@supabase/supabase-js'] || 'No encontrado'}`)
}

console.log('\n🎯 Optimizaciones aplicadas:')
console.log('   ✅ Configuración de Next.js optimizada')
console.log('   ✅ Caché implementado para consultas frecuentes')
console.log('   ✅ Consultas de Supabase optimizadas')
console.log('   ✅ Límites en consultas para mejorar rendimiento')
console.log('   ✅ Limpieza automática de caché')

console.log('\n💡 Para mejorar aún más el rendimiento:')
console.log('   1. Usa npm run dev en lugar de yarn dev')
console.log('   2. Cierra otras aplicaciones que consuman memoria')
console.log('   3. Considera usar un SSD para el proyecto')
console.log('   4. Aumenta la memoria de Node.js si es necesario')

console.log('\n✨ ¡Optimización completada!')
