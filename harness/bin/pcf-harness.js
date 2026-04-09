#!/usr/bin/env node

/**
 * CLI entry point for pcf-harness.
 * Delegates to the TypeScript source via tsx.
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { fork } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tsFile = join(__dirname, 'pcf-harness.ts');
const tsxPath = join(__dirname, '..', 'node_modules', 'tsx', 'dist', 'cli.mjs');

const child = fork(tsxPath, [tsFile, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

child.on('exit', (code) => process.exit(code ?? 0));
