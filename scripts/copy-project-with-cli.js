#!/usr/bin/env node

/**
 * Script para copiar proyecto usando Supabase CLI
 * 
 * Este script:
 * 1. Verifica si Supabase CLI está instalado
 * 2. Vincula el proyecto actual de Supabase
 * 3. Detecta qué tablas existen
 * 4. Exporta los datos
 * 5. Ayuda a configurar el nuevo proyecto
 * 
 * Uso: node scripts/copy-project-with-cli.js
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Verifica si Supabase CLI está instalado
 */
function checkSupabaseCLI() {
  try {
    const version = execSync('supabase --version', { encoding: 'utf-8' }).trim();
    log(`✅ Supabase CLI instalado: ${version}`, 'green');
    return true;
  } catch (error) {
    log('❌ Supabase CLI no está instalado', 'red');
    return false;
  }
}

/**
 * Instala Supabase CLI
 */
function installSupabaseCLI() {
  log('\n📦 Instalando Supabase CLI...', 'cyan');
  log('   Opciones de instalación:', 'yellow');
  log('   1. Windows (PowerShell como admin):', 'yellow');
  log('      scoop bucket add supabase https://github.com/supabase/scoop-bucket.git', 'cyan');
  log('      scoop install supabase', 'cyan');
  log('\n   2. Windows (con npm):', 'yellow');
  log('      npm install -g supabase', 'cyan');
  log('\n   3. macOS:', 'yellow');
  log('      brew install supabase/tap/supabase', 'cyan');
  log('\n   O visita: https://supabase.com/docs/guides/cli', 'yellow');
  log('\n   Después de instalar, ejecuta este script nuevamente.', 'yellow');
}

/**
 * Verifica si el proyecto está vinculado a Supabase
 */
function checkProjectLink() {
  const configPath = path.join(process.cwd(), 'supabase', 'config.toml');
  if (fs.existsSync(configPath)) {
    try {
      const config = fs.readFileSync(configPath, 'utf-8');
      if (config.includes('project_id')) {
        log('✅ Proyecto ya tiene configuración de Supabase', 'green');
        return true;
      }
    } catch (error) {
      // Ignorar
    }
  }
  return false;
}

/**
 * Muestra información del proyecto actual
 */
async function showCurrentProjectInfo() {
  try {
    log('\n🔍 Detectando información del proyecto actual...', 'cyan');
    
    // Intentar obtener información del .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    let supabaseUrl = null;
    let supabaseAnonKey = null;
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
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
    
    if (supabaseUrl) {
      log(`\n📊 Proyecto actual:`, 'cyan');
      log(`   URL: ${supabaseUrl}`, 'yellow');
      
      // Extraer project-ref de la URL
      const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
      if (match) {
        const projectRef = match[1];
        log(`   Project Ref: ${projectRef}`, 'yellow');
        return { projectRef, supabaseUrl, supabaseAnonKey };
      }
    }
    
    log('⚠️ No se encontró configuración de Supabase en .env.local', 'yellow');
    return null;
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return null;
  }
}

/**
 * Lista las tablas existentes usando SQL
 */
async function listTables(supabaseUrl, supabaseAnonKey) {
  if (!supabaseUrl || !supabaseAnonKey) {
    log('⚠️ No se puede listar tablas sin credenciales', 'yellow');
    return [];
  }
  
  try {
    log('\n📋 Detectando tablas existentes...', 'cyan');
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Lista de tablas conocidas del proyecto
    const knownTables = [
      'ingredients',
      'recipes',
      'recipe_ingredients',
      'products',
      'inventory',
      'inventory_movements',
      'orders',
      'order_items',
      'production_tasks',
      'events_calendar',
      'price_rules',
      'settings',
      'customers',
      'sales',
      'sale_items',
      'event_products',
      'ingredient_purchases',
      'product_price_history',
      'ingredient_price_history',
      'notification_tokens',
      'weekly_production_plans',
      'weekly_plan_tasks'
    ];
    
    const existingTables = [];
    
    for (const table of knownTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error || error.code !== 'PGRST116') {
          existingTables.push(table);
          process.stdout.write(`  ✓ ${table}\n`);
        }
      } catch (err) {
        // Tabla no existe
      }
    }
    
    log(`\n✅ Encontradas ${existingTables.length} tablas`, 'green');
    return existingTables;
    
  } catch (error) {
    log(`❌ Error al listar tablas: ${error.message}`, 'red');
    return [];
  }
}

/**
 * Exporta la base de datos usando Supabase CLI
 */
async function exportDatabase(projectRef) {
  if (!projectRef) {
    log('⚠️ No se puede exportar sin project-ref', 'yellow');
    return false;
  }
  
  try {
    log('\n📦 Exportando base de datos con Supabase CLI...', 'cyan');
    
    // Crear carpeta para exportación
    const exportDir = path.join(process.cwd(), 'database-export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    const backupFile = path.join(exportDir, `backup-${Date.now()}.sql`);
    
    log(`   Ejecutando: supabase db dump --project-ref ${projectRef} --file ${backupFile}`, 'yellow');
    
    // Ejecutar comando de dump
    execSync(`supabase db dump --project-ref ${projectRef} --file "${backupFile}"`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    log(`\n✅ Base de datos exportada a: ${backupFile}`, 'green');
    return backupFile;
    
  } catch (error) {
    log(`\n⚠️ Error al exportar con CLI: ${error.message}`, 'yellow');
    log('   Esto puede ser normal si no tienes la CLI vinculada.', 'yellow');
    log('   Podemos usar el método alternativo.', 'yellow');
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  log('\n🚀 Script de Copia de Proyecto con Supabase CLI', 'bright');
  log('='.repeat(50), 'cyan');
  
  // Paso 1: Verificar CLI
  log('\n📋 Paso 1: Verificando Supabase CLI...', 'cyan');
  const hasCLI = checkSupabaseCLI();
  
  if (!hasCLI) {
    installSupabaseCLI();
    process.exit(0);
  }
  
  // Paso 2: Obtener información del proyecto actual
  log('\n📋 Paso 2: Detectando proyecto actual...', 'cyan');
  const projectInfo = await showCurrentProjectInfo();
  
  if (!projectInfo) {
    log('\n❌ No se pudo detectar el proyecto actual.', 'red');
    log('   Asegúrate de tener .env.local configurado.', 'yellow');
    process.exit(1);
  }
  
  // Paso 3: Listar tablas
  log('\n📋 Paso 3: Listando tablas existentes...', 'cyan');
  const tables = await listTables(projectInfo.supabaseUrl, projectInfo.supabaseAnonKey);
  
  if (tables.length === 0) {
    log('⚠️ No se encontraron tablas. Asegúrate de que el proyecto esté configurado.', 'yellow');
  }
  
  // Paso 4: Exportar base de datos
  log('\n📋 Paso 4: Exportando base de datos...', 'cyan');
  const backupFile = await exportDatabase(projectInfo.projectRef);
  
  // Resumen y siguientes pasos
  log('\n' + '='.repeat(50), 'cyan');
  log('\n✅ Resumen:', 'green');
  log(`   • Proyecto actual: ${projectInfo.projectRef}`, 'yellow');
  log(`   • Tablas encontradas: ${tables.length}`, 'yellow');
  if (backupFile) {
    log(`   • Backup creado: ${backupFile}`, 'yellow');
  }
  
  log('\n📝 Próximos pasos para copiar el proyecto:', 'cyan');
  log('\n   1. Crear nuevo proyecto en Supabase Dashboard', 'yellow');
  log('   2. Obtener las nuevas credenciales (URL y keys)', 'yellow');
  log('   3. Copiar la carpeta del proyecto', 'yellow');
  log('   4. En el nuevo proyecto:', 'yellow');
  log('      - Actualizar .env.local con nuevas credenciales', 'yellow');
  if (backupFile) {
    log(`      - Ejecutar: supabase db restore --file "${backupFile}"`, 'yellow');
  } else {
    log('      - Ejecutar todas las migraciones SQL en orden', 'yellow');
    log('      - Importar datos manualmente o usar pg_dump', 'yellow');
  }
  log('   5. Crear bucket product-images en Storage', 'yellow');
  log('   6. Ejecutar: npm install && npm run dev', 'yellow');
  
  log('\n💡 Tip: Si tienes acceso directo a PostgreSQL:', 'cyan');
  log('   Puedes usar pg_dump desde el Connection String del Dashboard', 'yellow');
  
  log('\n');
}

// Ejecutar
main().catch(error => {
  log(`\n❌ Error fatal: ${error.message}`, 'red');
  process.exit(1);
});


