const fs = require('fs');
const path = require('path');

function generateSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="#2563eb"/>
  <text x="50%" y="54%" font-family="Arial, sans-serif" font-size="${Math.round(size * 0.35)}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">WT</text>
</svg>`;
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

[192, 512].forEach(size => {
  const svg = generateSVG(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), svg);
  console.log(`Generated icon-${size}.svg`);
});
