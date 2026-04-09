import fs from 'node:fs';
import path from 'node:path';
import { parseManifest } from '../parser/manifest-parser';
import type { ManifestConfig } from '../types/manifest';

export interface ControlEntry {
  manifest: ManifestConfig;
  controlDir: string;
  projectRoot: string;
  bundlePath: string | null;
  hasBuild: boolean;
  hasDataJson: boolean;
  hasTestScenarios: boolean;
  hasThumbnail: boolean;
  thumbnailPath: string | null;
  lastModified: string | null;
  /** Size of bundle.js in bytes, or null if no build */
  bundleSize: number | null;
  /** Total size of the out/ directory in bytes, or null if no build */
  packageSize: number | null;
  /** Whether the control is marked private (has .pcf-private file) */
  isPrivate: boolean;
}

/**
 * Calculate the total size of a directory in bytes (recursive).
 */
function dirSize(dir: string): number {
  let total = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile()) {
        try { total += fs.statSync(fullPath).size; } catch { /* skip */ }
      } else if (entry.isDirectory()) {
        total += dirSize(fullPath);
      }
    }
  } catch { /* skip unreadable dirs */ }
  return total;
}

/**
 * Find the compiled bundle path for a control directory.
 */
function findBundle(controlDir: string): string | null {
  let searchDir = controlDir;
  for (let i = 0; i < 4; i++) {
    const outPath = path.join(searchDir, 'out', 'controls');
    if (fs.existsSync(outPath)) {
      try {
        const entries = fs.readdirSync(outPath);
        for (const entry of entries) {
          const bundlePath = path.join(outPath, entry, 'bundle.js');
          if (fs.existsSync(bundlePath)) return bundlePath;
        }
      } catch { /* ignore */ }
    }
    searchDir = path.dirname(searchDir);
  }
  return null;
}

/**
 * Find the project root (directory containing out/) for a control.
 */
function findProjectRoot(controlDir: string): string {
  let searchDir = controlDir;
  for (let i = 0; i < 4; i++) {
    if (fs.existsSync(path.join(searchDir, 'out'))) return searchDir;
    searchDir = path.dirname(searchDir);
  }
  return controlDir;
}

/**
 * Recursively find all ControlManifest.Input.xml files under a root directory.
 */
function findManifests(rootDir: string, maxDepth = 5): string[] {
  const results: string[] = [];
  const skipDirs = new Set(['node_modules', 'out', '.git', '.vs', 'dist', 'build']);

  function walk(dir: string, depth: number) {
    if (depth > maxDepth) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isFile() && entry.name === 'ControlManifest.Input.xml') {
        results.push(path.join(dir, entry.name));
      } else if (entry.isDirectory() && !skipDirs.has(entry.name)) {
        walk(path.join(dir, entry.name), depth + 1);
      }
    }
  }

  walk(rootDir, 0);
  return results;
}

/**
 * Scan a workspace root directory for all PCF controls.
 */
export function scanWorkspace(workspaceRoot: string): ControlEntry[] {
  const manifests = findManifests(workspaceRoot);
  const controls: ControlEntry[] = [];
  const seen = new Set<string>(); // deduplicate by namespace.constructor

  for (const manifestPath of manifests) {
    try {
      const xmlContent = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = parseManifest(xmlContent);
      const key = `${manifest.namespace}.${manifest.constructor}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const controlDir = path.dirname(manifestPath);
      const projectRoot = findProjectRoot(controlDir);
      const bundlePath = findBundle(controlDir);

      // Check for thumbnail image files
      const thumbnailCandidates = [
        path.join(controlDir, 'thumbnail.gif'),
        path.join(controlDir, 'thumbnail.jpg'),
        path.join(controlDir, 'thumbnail.jpeg'),
        path.join(controlDir, 'thumbnail.png'),
        path.join(projectRoot, 'thumbnail.gif'),
        path.join(projectRoot, 'thumbnail.jpg'),
        path.join(projectRoot, 'thumbnail.jpeg'),
        path.join(projectRoot, 'thumbnail.png'),
      ];
      const thumbnailPath = thumbnailCandidates.find(t => fs.existsSync(t)) ?? null;

      // Get bundle last modified time and sizes
      let lastModified: string | null = null;
      let bundleSize: number | null = null;
      let packageSize: number | null = null;
      if (bundlePath) {
        try {
          const stat = fs.statSync(bundlePath);
          lastModified = stat.mtime.toISOString();
          bundleSize = stat.size;
        } catch { /* ignore */ }
        // Calculate total out/ directory size
        const outDir = path.join(projectRoot, 'out');
        if (fs.existsSync(outDir)) {
          packageSize = dirSize(outDir);
        }
      }

      controls.push({
        manifest,
        controlDir,
        projectRoot,
        bundlePath,
        hasBuild: bundlePath !== null,
        hasDataJson: fs.existsSync(path.join(controlDir, 'data.json')) || fs.existsSync(path.join(projectRoot, 'data.json')),
        hasTestScenarios: fs.existsSync(path.join(controlDir, 'test-scenarios.json')) || fs.existsSync(path.join(projectRoot, 'test-scenarios.json')),
        hasThumbnail: thumbnailPath !== null,
        thumbnailPath,
        lastModified,
        bundleSize,
        packageSize,
        isPrivate: fs.existsSync(path.join(controlDir, '.pcf-private')) || fs.existsSync(path.join(projectRoot, '.pcf-private')),
      });
    } catch {
      // Skip manifests that fail to parse
    }
  }

  // Sort: built controls first, then by name
  controls.sort((a, b) => {
    if (a.hasBuild !== b.hasBuild) return a.hasBuild ? -1 : 1;
    return a.manifest.constructor.localeCompare(b.manifest.constructor);
  });

  return controls;
}
