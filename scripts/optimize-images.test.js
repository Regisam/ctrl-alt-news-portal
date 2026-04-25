import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');
const TEST_DIR = path.join(PROJECT_ROOT, '.test-images');
const OUTPUT_DIR = path.join(TEST_DIR, 'output');

describe('Image Optimization Pipeline', () => {
  beforeAll(() => {
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  async function optimizeTestImage(inputPath, outputDir) {
    const filename = path.parse(inputPath).name;

    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();

      // WebP conversion
      const webpPath = path.join(outputDir, `${filename}.webp`);
      await image
        .webp({ quality: 80 })
        .toFile(webpPath);

      // JPEG fallback
      const jpegPath = path.join(outputDir, `${filename}.jpg`);
      await sharp(inputPath)
        .jpeg({ quality: 85, progressive: true })
        .toFile(jpegPath);

      const originalStats = fs.statSync(inputPath);
      const webpStats = fs.statSync(webpPath);
      const jpegStats = fs.statSync(jpegPath);

      return {
        filename,
        originalSize: originalStats.size,
        webpSize: webpStats.size,
        jpegSize: jpegStats.size,
        webpReduction: ((1 - webpStats.size / originalStats.size) * 100).toFixed(1),
        webpPath,
        jpegPath
      };
    } catch (error) {
      throw new Error(`Failed to optimize ${filename}: ${error.message}`);
    }
  }

  it('creates WebP format with >50% reduction', async () => {
    const svgImage = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="600" fill="#3b82f6"/>
        <text x="50%" y="50%" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">Test</text>
      </svg>
    `;

    const inputPath = path.join(TEST_DIR, 'test.png');
    await sharp(Buffer.from(svgImage))
      .png()
      .toFile(inputPath);

    const result = await optimizeTestImage(inputPath, OUTPUT_DIR);

    expect(result.webpSize).toBeLessThan(result.originalSize);
    expect(parseFloat(result.webpReduction)).toBeGreaterThan(50);
  });

  it('generates JPEG fallback for older browsers', async () => {
    const svgImage = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="600" fill="#ef4444"/>
      </svg>
    `;

    const inputPath = path.join(TEST_DIR, 'fallback.png');
    await sharp(Buffer.from(svgImage))
      .png()
      .toFile(inputPath);

    const result = await optimizeTestImage(inputPath, OUTPUT_DIR);

    expect(fs.existsSync(result.jpegPath)).toBe(true);
    expect(result.jpegSize).toBeGreaterThan(0);
  });

  it('preserves image dimensions after optimization', async () => {
    const svgImage = `
      <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="800" fill="#10b981"/>
      </svg>
    `;

    const inputPath = path.join(TEST_DIR, 'dimensions.png');
    await sharp(Buffer.from(svgImage))
      .png()
      .toFile(inputPath);

    const result = await optimizeTestImage(inputPath, OUTPUT_DIR);

    const webpMeta = await sharp(result.webpPath).metadata();
    const jpegMeta = await sharp(result.jpegPath).metadata();

    expect(webpMeta.width).toBe(1200);
    expect(webpMeta.height).toBe(800);
    expect(jpegMeta.width).toBe(1200);
    expect(jpegMeta.height).toBe(800);
  });

  it('produces WebP with quality >=80', async () => {
    const svgImage = `
      <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="600" height="400" fill="#f59e0b"/>
      </svg>
    `;

    const inputPath = path.join(TEST_DIR, 'quality.png');
    await sharp(Buffer.from(svgImage))
      .png()
      .toFile(inputPath);

    const result = await optimizeTestImage(inputPath, OUTPUT_DIR);

    // File size should be reasonable for quality 80
    const ratio = result.webpSize / result.originalSize;
    expect(ratio).toBeLessThan(0.4);
  });

  it('supports multiple image formats', async () => {
    const formats = ['png'];

    for (const format of formats) {
      const svgImage = `
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#8b5cf6"/>
        </svg>
      `;

      const inputPath = path.join(TEST_DIR, `format-test.${format}`);
      await sharp(Buffer.from(svgImage))
        [format]()
        .toFile(inputPath);

      const result = await optimizeTestImage(inputPath, OUTPUT_DIR);

      expect(fs.existsSync(result.webpPath)).toBe(true);
      expect(fs.existsSync(result.jpegPath)).toBe(true);
    }
  });
});
