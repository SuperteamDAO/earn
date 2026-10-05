const { spawnSync } = require('node:child_process');
const { copyFileSync, mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');

// Validate without touching node_modules or rewriting the working lockfile.
const root = resolve(__dirname, '..');
const directory = mkdtempSync(join(tmpdir(), 'earn-lockfile-'));

try {
  for (const file of ['package.json', 'pnpm-lock.yaml', '.npmrc']) {
    copyFileSync(join(root, file), join(directory, file));
  }

  const result = spawnSync(
    'corepack',
    [
      'pnpm',
      'install',
      '--lockfile-only',
      '--frozen-lockfile',
      '--ignore-scripts',
      '--offline',
    ],
    { cwd: directory, stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
