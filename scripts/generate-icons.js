/**
 * Script to generate PWA icons
 * Run: node scripts/generate-icons.js
 * 
 * Note: This requires node-canvas or you can use the HTML version (generate-icons.html)
 * For a simpler approach, you can also create the icons manually using any image editor.
 */

import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateIcon(size) {
  try {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Fill with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    
    // Load the logo image
    const logoPath = path.join(__dirname, '..', 'public', 'PalettePlottingLogoV1.png');
    if (!fs.existsSync(logoPath)) {
      throw new Error(`Logo file not found at: ${logoPath}`);
    }
    
    const logo = await loadImage(logoPath);
    
    // Calculate dimensions to fit logo in square while maintaining aspect ratio
    const logoAspect = logo.width / logo.height;
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (logoAspect > 1) {
      // Logo is wider than tall
      drawWidth = size * 0.9; // Use 90% of canvas width
      drawHeight = drawWidth / logoAspect;
      offsetX = (size - drawWidth) / 2;
      offsetY = (size - drawHeight) / 2;
    } else {
      // Logo is taller than wide or square
      drawHeight = size * 0.9; // Use 90% of canvas height
      drawWidth = drawHeight * logoAspect;
      offsetX = (size - drawWidth) / 2;
      offsetY = (size - drawHeight) / 2;
    }
    
    // Draw the logo centered on black background
    ctx.drawImage(logo, offsetX, offsetY, drawWidth, drawHeight);
    
    // Save to file
    const buffer = canvas.toBuffer('image/png');
    const outputPath = path.join(__dirname, '..', 'public', `icon-${size}.png`);
    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Generated icon-${size}.png`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error generating ${size}x${size} icon:`, error.message);
    console.log('💡 Tip: Install canvas package: npm install canvas');
    console.log('   Or use the HTML version: open scripts/generate-icons.html in a browser');
    return false;
  }
}

// Generate both icon sizes
console.log('🎨 Generating PWA icons from logo...\n');
(async () => {
  const success192 = await generateIcon(192);
  const success512 = await generateIcon(512);

  if (success192 && success512) {
    console.log('\n✅ All icons generated successfully!');
  } else {
    console.log('\n⚠️  Some icons failed to generate. You can:');
    console.log('   1. Install canvas: npm install canvas');
    console.log('   2. Use the HTML generator: open scripts/generate-icons.html in a browser');
    console.log('   3. Create icons manually (192x192 and 512x512 PNG files)');
  }
})();






















































