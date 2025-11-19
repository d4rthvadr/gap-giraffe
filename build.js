// Build script using esbuild to bundle the extension

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Clean dist directory
const distDir = path.join(__dirname, 'extension', 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Build configuration
const buildConfig = {
  bundle: true,
  minify: false,
  sourcemap: true,
  target: 'es2020',
  format: 'iife', // Immediately Invoked Function Expression - no modules
  external: ['sql.js'], // Don't bundle sql.js, load it externally
};

// Build background script
esbuild.build({
  ...buildConfig,
  entryPoints: ['src/background.ts'],
  outfile: 'extension/dist/background.js',
  platform: 'browser',
}).then(() => console.log('✓ Background script built')).catch(() => process.exit(1));

// Build popup script
esbuild.build({
  ...buildConfig,
  entryPoints: ['src/popup/popup.ts'],
  outfile: 'extension/dist/popup/popup.js',
  platform: 'browser',
}).then(() => console.log('✓ Popup script built')).catch(() => process.exit(1));

// Build content script
esbuild.build({
  ...buildConfig,
  entryPoints: ['src/content/content.ts'],
  outfile: 'extension/dist/content/content.js',
  platform: 'browser',
}).then(() => console.log('✓ Content script built')).catch(() => process.exit(1));

// Build options page
esbuild.build({
  ...buildConfig,
  entryPoints: ['src/options/options.ts'],
  outfile: 'extension/dist/options/options.js',
  platform: 'browser',
}).then(() => console.log('✓ Options page built')).catch(() => process.exit(1));
