#!/usr/bin/env node

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist', 'js');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Build configuration
esbuild.build({
  entryPoints: ['src/auth.js'],
  bundle: true,
  outfile: 'dist/js/bundle-auth.js',
  format: 'iife',
  platform: 'browser',
  target: ['chrome90'],
  minify: false, // Keep it readable for debugging
  sourcemap: true,
  define: {
    'process.env.NODE_ENV': '"production"'
  }
}).then(() => {
  console.log('✓ Build complete: dist/js/bundle-auth.js');
}).catch((error) => {
  console.error('✗ Build failed:', error);
  process.exit(1);
});
