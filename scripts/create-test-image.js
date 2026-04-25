import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'images', 'src');

async function createTestImage() {
  // Create a simple test image (red background with white text placeholder)
  const width = 1200;
  const height = 800;

  const svgImage = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad1)"/>
      <text x="50%" y="50%" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial">
        Test Article Image
      </text>
      <text x="50%" y="65%" font-size="24" fill="rgba(255,255,255,0.7)" text-anchor="middle" dominant-baseline="middle" font-family="Arial">
        1200x800px - Optimized for Web
      </text>
    </svg>
  `;

  try {
    await sharp(Buffer.from(svgImage))
      .png()
      .toFile(path.join(OUTPUT_DIR, 'hero-article-1.png'));

    console.log('✓ Test image created: hero-article-1.png');
  } catch (error) {
    console.error('Error creating test image:', error.message);
  }
}

createTestImage();
