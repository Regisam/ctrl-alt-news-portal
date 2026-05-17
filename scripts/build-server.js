#!/usr/bin/env node
/**
 * Build server TypeScript → JavaScript
 * Compiles server/index.ts to dist/index.js using esbuild
 */

import { buildSync } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

try {
  console.log('🔨 Building server...');

  // Find all TypeScript files in server directory
  const serverFiles = globSync(path.join(projectRoot, 'server/**/*.ts'));

  buildSync({
    entryPoints: serverFiles,
    outdir: path.join(projectRoot, 'dist'),
    bundle: false, // Transpile only, don't bundle
    platform: 'node',
    target: 'node22',
    format: 'esm',
    sourcemap: false,
    minify: process.env.NODE_ENV === 'production',
  });

  console.log('✅ Server built successfully to dist/index.js');
} catch (error) {
  console.error('❌ Server build failed:', error.message);
  process.exit(1);
}
