/**
 * Build script for PDF handler
 * Bundles pdf-handler.js with pdfjs-dist using esbuild
 */

const esbuild = require('esbuild');
const path = require('path');

async function build() {
  console.log('Building PDF handler...');
  
  try {
    await esbuild.build({
      entryPoints: ['pdf-handler.js'],
      bundle: true,
      outfile: 'dist/js/bundle-pdf-handler.js',
      platform: 'browser',
      format: 'iife',
      target: ['chrome91'],
      sourcemap: true,
      minify: false,
      external: [], // Don't externalize pdfjs-dist
      define: {
        'global': 'window'
      }
    });
    
    console.log('✓ Build complete: dist/js/bundle-pdf-handler.js');
  } catch (error) {
    console.error('✗ Build failed:', error);
    process.exit(1);
  }
}

build();
