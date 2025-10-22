/**
 * Script para probar el rendimiento del caché
 * Ejecuta múltiples consultas y mide los tiempos
 */

const { performance } = require('perf_hooks');

async function testCachePerformance() {
  console.log('🚀 Probando rendimiento del sistema de caché...\n');

  const baseUrl = 'http://localhost:3000';

  // Función para medir tiempo de carga de página
  async function measurePageLoad(url, description) {
    const startTime = performance.now();

    try {
      const response = await fetch(url);
      const endTime = performance.now();
      const loadTime = Math.round(endTime - startTime);

      console.log(`📊 ${description}: ${loadTime}ms`);

      if (loadTime > 1000) {
        console.log(`   ⚠️  LENTO: ${loadTime}ms > 1000ms`);
      } else if (loadTime < 200) {
        console.log(`   ✅ RÁPIDO: ${loadTime}ms < 200ms`);
      } else {
        console.log(`   ⚡ ACEPTABLE: ${loadTime}ms`);
      }

      return loadTime;
    } catch (error) {
      console.log(`❌ ERROR en ${description}: ${error.message}`);
      return null;
    }
  }

  // Probar carga inicial (debería ser lenta)
  console.log('🔄 Primera carga (sin caché):');
  await measurePageLoad(`${baseUrl}/productos`, 'Productos - Primera carga');

  // Esperar un poco
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Probar carga con caché (debería ser instantánea)
  console.log('\n💾 Carga con caché activado:');
  await measurePageLoad(`${baseUrl}/productos`, 'Productos - Con caché');
  await measurePageLoad(`${baseUrl}/productos`, 'Productos - Segunda consulta');
  await measurePageLoad(`${baseUrl}/productos`, 'Productos - Tercera consulta');

  // Probar otras páginas
  console.log('\n📋 Probando otras páginas:');
  await measurePageLoad(`${baseUrl}/ingredientes`, 'Ingredientes - Primera carga');
  await measurePageLoad(`${baseUrl}/ingredientes`, 'Ingredientes - Con caché');
  await measurePageLoad(`${baseUrl}/recetas`, 'Recetas - Primera carga');
  await measurePageLoad(`${baseUrl}/recetas`, 'Recetas - Con caché');

  console.log('\n✅ Prueba completada!');
  console.log('💡 Si las cargas con caché son > 200ms, revisa la implementación del caché');
  console.log('💡 Si las primeras cargas son > 2000ms, considera optimizar las consultas SQL');
}

testCachePerformance().catch(console.error);
