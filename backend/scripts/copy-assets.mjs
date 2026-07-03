// Copies non-TS runtime assets into dist/ after the TypeScript build.
// tsc only emits compiled JS, but the app reads schema.sql at runtime
// (db/migrate.ts applies it on boot), so it must live alongside the compiled
// output. Cross-platform (plain Node) so it runs the same on Windows and Linux.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const assets = [['src/db/schema.sql', 'dist/db/schema.sql']];

for (const [from, to] of assets) {
  const dest = join(root, to);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(join(root, from), dest);
  console.log(`copied ${from} -> ${to}`);
}
