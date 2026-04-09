#!/usr/bin/env node

// CLI entry point for the PCF Dev Harness.
// Usage: npx pcf-harness --path <control-directory>
// The control directory should contain ControlManifest.Input.xml.
// The control must be built first (npm run build) so that out/controls/{Name}/bundle.js exists.

import { Command } from 'commander';
import { createServer } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const harnessRoot = path.resolve(__dirname, '..');

const program = new Command();

program
  .name('pcf-harness')
  .description('Enhanced PCF development harness with offline simulation, network conditioning, and performance monitoring')
  .version('0.1.0')
  .requiredOption('--path <dir>', 'Path to the PCF control directory (containing ControlManifest.Input.xml)')
  .option('--port <number>', 'Port to run the dev server on', '8181')
  .option('--no-open', 'Do not open the browser automatically')
  .action(async (opts) => {
    const controlPath = path.resolve(opts.path);

    // Validate the control directory
    const manifestPath = path.join(controlPath, 'ControlManifest.Input.xml');
    if (!fs.existsSync(manifestPath)) {
      console.error(`\n  Error: ControlManifest.Input.xml not found at:\n  ${manifestPath}\n`);
      console.error(`  Make sure --path points to the directory containing ControlManifest.Input.xml.`);
      console.error(`  Example: pcf-harness --path ./BookingStatusTransitionControl/BookingStatusTransitionControl\n`);
      process.exit(1);
    }

    // Set the control path for the Vite plugin to pick up
    process.env.PCF_CONTROL_PATH = controlPath;

    console.log(`\n  PCF Dev Harness`);
    console.log(`  Control: ${controlPath}`);
    console.log(`  Port:    ${opts.port}\n`);

    try {
      const server = await createServer({
        configFile: path.join(harnessRoot, 'vite.config.ts'),
        root: harnessRoot,
        server: {
          port: parseInt(opts.port, 10),
          open: opts.open !== false,
        },
      });

      await server.listen();
      server.printUrls();
      console.log('\n  Press Ctrl+C to stop.\n');
    } catch (err: any) {
      console.error('Failed to start harness:', err.message);
      process.exit(1);
    }
  });

program.parse();
