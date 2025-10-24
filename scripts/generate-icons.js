const fs = require('fs');
const path = require('path');

// Tamaños de iconos requeridos para PWA
const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

// SVG base que se usará para generar todos los iconos
const svgTemplate = `<svg width="{SIZE}" height="{SIZE}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Fondo circular con gradiente -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="cupcakeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="frostingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f472b6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Fondo circular -->
  <circle cx="256" cy="256" r="240" fill="url(#bgGradient)" stroke="#fff" stroke-width="8"/>
  
  <!-- Base del cupcake -->
  <ellipse cx="256" cy="320" rx="80" ry="40" fill="url(#cupcakeGradient)"/>
  
  <!-- Cuerpo del cupcake -->
  <path d="M 176 320 Q 256 200 336 320 L 336 360 Q 256 280 176 360 Z" fill="url(#cupcakeGradient)"/>
  
  <!-- Frosting -->
  <path d="M 200 280 Q 256 180 312 280 Q 256 200 200 280" fill="url(#frostingGradient)"/>
  
  <!-- Decoración del frosting -->
  <circle cx="220" cy="260" r="8" fill="#fbbf24"/>
  <circle cx="256" cy="250" r="6" fill="#fbbf24"/>
  <circle cx="292" cy="260" r="8" fill="#fbbf24"/>
  
  <!-- Líneas decorativas en la base -->
  <ellipse cx="256" cy="340" rx="60" ry="15" fill="none" stroke="#f59e0b" stroke-width="3"/>
  
  <!-- Sombra -->
  <ellipse cx="256" cy="380" rx="70" ry="20" fill="#000" opacity="0.1"/>
</svg>`;

// Función para generar SVG con el tamaño especificado
function generateSVG(size) {
  return svgTemplate.replace(/{SIZE}/g, size);
}

// Crear directorio de iconos si no existe
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generar archivos SVG para cada tamaño
iconSizes.forEach(({ size, name }) => {
  const svgContent = generateSVG(size);
  const filename = name.replace('.png', '.svg');
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✅ Generado: ${filename} (${size}x${size})`);
});

console.log('\n🎉 Todos los iconos SVG han sido generados!');
console.log('📝 Nota: Para convertir a PNG, puedes usar herramientas online como:');
console.log('   - https://convertio.co/svg-png/');
console.log('   - https://cloudconvert.com/svg-to-png');
console.log('   - O usar herramientas locales como ImageMagick');
