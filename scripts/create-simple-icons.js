const fs = require('fs');
const path = require('path');

// Función para crear un PNG simple usando canvas (si está disponible) o crear un SVG que se puede convertir
function createSimpleIcon(size) {
  // Crear un SVG simple que se puede usar directamente
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#f97316"/>
        <stop offset="100%" style="stop-color:#ec4899"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size/8}" fill="url(#bg)"/>
    <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-family="Arial, sans-serif" font-size="${size/4}" font-weight="bold" fill="white">🍰</text>
  </svg>`;
  
  return svg;
}

// Tamaños requeridos
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Crear directorio si no existe
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generar iconos SVG simples
sizes.forEach(size => {
  const svg = createSimpleIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`✅ Generado: ${filename}`);
});

console.log('\n🎉 Iconos SVG generados!');
console.log('📱 Estos iconos funcionarán perfectamente en la PWA.');
