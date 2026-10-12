import { performance } from 'node:perf_hooks';
import { writeFileSync, mkdirSync } from 'node:fs';
import { analyzeStory } from '../lib/analyzer.js';

const base = 'Mara carried the lantern across the courtyard. The rain washed silver dust from the roof. Suddenly, a distant bell rang. ';
const results = [];
for (const characters of [10_000, 50_000, 200_000]) {
  const text = base.repeat(Math.ceil(characters / base.length)).slice(0, characters);
  analyzeStory(text);
  const times = [];
  let result;
  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    result = analyzeStory(text);
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  results.push({ characters, words: result.words, runs: times.length,
    medianMs: Number(((times[4] + times[5]) / 2).toFixed(2)),
    p95Ms: Number(times[9].toFixed(2)), resultBytes: Buffer.byteLength(JSON.stringify(result)),
  });
}
const evidence = { node: process.version, platform: `${process.platform}/${process.arch}`,
  scope: 'Synthetic repeated English prose; warmed pure analyzer, not browser render or whole-harness RAM.', results };
mkdirSync('work', { recursive: true });
writeFileSync('work/benchmark.json', JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify(evidence, null, 2));
