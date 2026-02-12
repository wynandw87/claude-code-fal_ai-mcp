#!/usr/bin/env node

/**
 * Post-install script for fal-ai-mcp-server
 * Displays installation instructions and helpful information
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n✅ fal.ai MCP Server installed successfully!\n');

// Check if this is a global install or local
const isGlobal = process.env.npm_config_global === 'true';

if (isGlobal) {
  console.log('📦 Global installation detected\n');
  console.log('To use with Claude Code, run:');
  console.log('  claude mcp add fal_ai -- fal-ai-mcp-server\n');
  console.log('Or with API key:');
  console.log('  claude mcp add fal_ai -e FAL_KEY="your-key" -- fal-ai-mcp-server\n');
} else {
  const distPath = join(__dirname, '..', 'dist', 'index.js');
  const hasDistFile = existsSync(distPath);

  console.log('📦 Local installation detected\n');

  if (hasDistFile) {
    console.log('To use with Claude Code, run:');
    console.log(`  claude mcp add fal_ai -- node "${distPath.replace(/\\/g, '/')}"\n`);
    console.log('Or with API key:');
    console.log(`  claude mcp add fal_ai -e FAL_KEY="your-key" -- node "${distPath.replace(/\\/g, '/')}"\n`);
    console.log('Or use the automated installer:');
    console.log('  npm run install:claude\n');
  } else {
    console.log('⚠️  Build files not found. Run npm run build first.\n');
  }
}

console.log('📖 Get your fal.ai API key from:');
console.log('   https://fal.ai/dashboard/keys\n');

console.log('📚 For more information, see the README.md file\n');
