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


const buildPaths = [
  {
    name: 'background',
    entryPoints: ['src/background.ts'],
    outfile: 'extension/dist/background.js',
    platform: 'browser',
  },
  {
    name: 'popup',
    entryPoints: ['src/popup/popup.ts'],
    outfile: 'extension/dist/popup/popup.js',
    platform: 'browser',
  },
  {
    name: 'content',
    entryPoints: ['src/content/content.ts'],
    outfile: 'extension/dist/content/content.js',
    platform: 'browser',
  },
  {
    name: 'options',
    entryPoints: ['src/options/options.ts'],
    outfile: 'extension/dist/options/options.js',
    platform: 'browser',
  },
  {
    name: 'resumes',
    entryPoints: ['src/resumes/resumes.ts'],
    outfile: 'extension/dist/resumes/resumes.js',
    platform: 'browser',
  },
  {
    name: 'results',
    entryPoints: ['src/results/results.ts'],
    outfile: 'extension/dist/results/results.js',
    platform: 'browser',
  },
  {
    name: 'tracker',
    entryPoints: ['src/tracker/tracker.ts'],
    outfile: 'extension/dist/tracker/tracker.js',
    platform: 'browser',
  },
];

buildPaths.forEach((path) => {
  esbuild.build({
    ...buildConfig,
    entryPoints: path.entryPoints,
    outfile: path.outfile,
    platform: path.platform,
  }).then(() => console.log(`✓ ${path.name} built`)).catch(() => process.exit(1));
});
