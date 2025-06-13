#!/usr/bin/env node
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🎵 Starting AudioLabStudio...');

// Check for Node.js
try {
  execSync('node --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Node.js is required to run AudioLabStudio');
  console.error('Please install Node.js from https://nodejs.org');
  process.exit(1);
}

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/audiolabstudio';

// Start the application
(async () => {
  try {
    const appPath = join(__dirname, 'dist', 'index.js');
    await import(appPath);
  } catch (error) {
    console.error('❌ Failed to start AudioLabStudio:', error.message);
    process.exit(1);
  }
})();
