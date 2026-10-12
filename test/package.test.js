import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as host from '../index.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const patch = readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8');

test('host is importable ESM without browser globals or runtime dependencies', () => {
  assert.equal(host.name, 'novel-quality-analyzer');
  assert.equal(typeof host.apply, 'function');
  assert.equal(host.analyzeStory('the story').words, 2);
  assert.equal(Object.keys(pkg.dependencies ?? {}).length, 0);
});

test('bundle patch and browser loader use the published package identity', () => {
  assert.equal(pkg.name, 'dsh-novel-quality-analyzer');
  assert.match(patch, /name: dsh-novel-quality-analyzer/);
  assert.match(readFileSync(new URL('../client.js', import.meta.url), 'utf8'), /id: "dsh-novel-quality-analyzer"/);
});

test('package version agrees with analysis output', () => {
  assert.equal(host.analyzeStory('text').analyzerVersion, pkg.version);
  assert.equal(pkg.publishConfig.access, 'public');
});
