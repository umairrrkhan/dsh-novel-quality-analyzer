import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = JSON.parse(execFileSync(npm, ['pack', '--dry-run', '--json', '--ignore-scripts', '--cache', './work/npm-cache'], { encoding: 'utf8' }))[0];
const files = new Set(result.files.map((entry) => entry.path));
for (const file of ['index.js', 'client.js', 'lib/analyzer.js', 'cordis.patch.yml', 'README.md', 'LICENSE', 'CHANGELOG.md', 'docs/REPORT.md', 'package.json']) {
  assert.ok(files.has(file), `Missing release file: ${file}`);
}
for (const file of files) {
  assert.ok(!/(^|\/)(work|node_modules|test|\.git|\.npmrc)(\/|$)/.test(file), `Unexpected release file: ${file}`);
}
const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
assert.equal(result.name, manifest.name);
assert.ok(result.size < 100_000, 'Unexpectedly large release archive');
console.log(JSON.stringify({ package: result.name, version: result.version, tarballBytes: result.size,
  unpackedBytes: result.unpackedSize, files: [...files].sort() }, null, 2));
