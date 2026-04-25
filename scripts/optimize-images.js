import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');
const SOURCE_DIR = path.join(PROJECT_ROOT, 'public', 'images', 'src');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'images', 'optimized');

const QUALITY_SETTINGS = {
  webp: 80,
  jpeg: 85
};

async function optimizeImage(inputPath, outputDir) {
  const filename = path.parse(inputPath).name;

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    console.log(`Processing: ${filename} (${metadata.width}x${metadata.height})`);

    // WebP conversion
    const webpPath = path.join(outputDir, `${filename}.webp`);
    await image
      .webp({ quality: QUALITY_SETTINGS.webp })
      .toFile(webpPath);

    const webpStats = fs.statSync(webpPath);
    console.log(`  ✓ WebP: ${webpStats.size} bytes`);

    // JPEG fallback
    const jpegPath = path.join(outputDir, `${filename}.jpg`);
    await sharp(inputPath)
      .jpeg({ quality: QUALITY_SETTINGS.jpeg, progressive: true })
      .toFile(jpegPath);

    const jpegStats = fs.statSync(jpegPath);
    console.log(`  ✓ JPEG: ${jpegStats.size} bytes`);

    // Calculate size reduction
    const originalStats = fs.statSync(inputPath);
    const reduction = ((1 - webpStats.size / originalStats.size) * 100).toFixed(1);
    console.log(`  📊 WebP reduction: ${reduction}%`);

    return { filename, webpSize: webpStats.size, jpegSize: jpegStats.size, originalSize: originalStats.size };
  } catch (error) {
    console.error(`  ✗ Error processing ${filename}:`, error.message);
    return null;
  }
}

async function optimizeAllImages() {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Check if source directory exists
  if (!fs.existsSync(SOURCE_DIR)) {
    console.log(`Source directory not found: ${SOURCE_DIR}`);
    console.log('Creating placeholder directory...');
    fs.mkdirSync(SOURCE_DIR, { recursive: true });
    console.log('Place your images in:', SOURCE_DIR);
    return;
  }

  const files = fs.readdirSync(SOURCE_DIR)
    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

  if (files.length === 0) {
    console.log('No image files found in source directory');
    return;
  }

  console.log(`\n🖼️  Optimizing ${files.length} image(s)...\n`);

  let totalOriginal = 0;
  let totalWebp = 0;
  let totalJpeg = 0;

  for (const file of files) {
    const inputPath = path.join(SOURCE_DIR, file);
    const result = await optimizeImage(inputPath, OUTPUT_DIR);

    if (result) {
      totalOriginal += result.originalSize;
      totalWebp += result.webpSize;
      totalJpeg += result.jpegSize;
    }
  }

  console.log('\n📈 Summary:');
  console.log(`  Original total: ${(totalOriginal / 1024).toFixed(2)} KB`);
  console.log(`  WebP total: ${(totalWebp / 1024).toFixed(2)} KB (${((1 - totalWebp / totalOriginal) * 100).toFixed(1)}% reduction)`);
  console.log(`  JPEG total: ${(totalJpeg / 1024).toFixed(2)} KB\n`);
}

optimizeAllImages().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
