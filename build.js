#!/usr/bin/env node

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist', 'js');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Check if clerk-config.js exists
const clerkConfigPath = path.join(__dirname, 'clerk-config.js');
if (!fs.existsSync(clerkConfigPath)) {
  console.error('\n❌ Error: clerk-config.js not found!\n');
  console.error('The Clerk configuration file is required for authentication to work.');
  console.error('\nTo fix this issue:');
  console.error('1. Copy the example configuration:');
  console.error('   cp clerk-config.example.js clerk-config.js');
  console.error('\n2. Edit clerk-config.js with your Clerk publishable key');
  console.error('   Get your key from: https://dashboard.clerk.com > API Keys');
  console.error('\n3. Run the build again:');
  console.error('   npm run build');
  console.error('\nFor detailed instructions, see CLERK_SETUP.md\n');
  process.exit(1);
}

// Validate clerk-config.js has a valid key
try {
  const clerkConfig = require(clerkConfigPath);
  if (!clerkConfig.publishableKey || 
      clerkConfig.publishableKey === 'YOUR_CLERK_PUBLISHABLE_KEY_HERE' ||
      clerkConfig.publishableKey.trim() === '') {
    console.warn('\n⚠️  Warning: clerk-config.js contains a placeholder or empty publishable key.\n');
    console.warn('Authentication will not work until you set a valid Clerk publishable key.');
    console.warn('Get your key from: https://dashboard.clerk.com > API Keys\n');
  } else if (clerkConfig.publishableKey.startsWith('pk_test_')) {
    console.warn('\n⚠️  Warning: Using development/test Clerk key (pk_test_...)\n');
    console.warn('Development keys have strict usage limits and should ONLY be used for testing.');
    console.warn('For production, use a production key (pk_live_...) from your Clerk dashboard.\n');
  } else if (clerkConfig.publishableKey.startsWith('pk_live_')) {
    console.log('✓ Using production Clerk key');
  }
} catch (error) {
  console.error('\n❌ Error: Failed to load clerk-config.js:', error.message, '\n');
  process.exit(1);
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
  
  // Provide helpful error messages for common issues
  if (error.message && error.message.includes('clerk-config.js')) {
    console.error('\n❌ Error: clerk-config.js file issue detected.\n');
    console.error('Make sure:');
    console.error('1. The file exists in the root directory');
    console.error('2. It exports a CLERK_CONFIG object with a publishableKey');
    console.error('\nFor help, see CLERK_SETUP.md\n');
  }
  
  process.exit(1);
});
