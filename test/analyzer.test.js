import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeStory, DEFAULT_OPTIONS, formatReport } from '../lib/analyzer.js';

test('empty and punctuation-only input is unscored with finite metrics', () => {
  for (const text of ['', '   \n', '?! 123 —']) {
    const result = analyzeStory(text);
    assert.equal(result.words, 0);
    assert.equal(result.score, null);
    assert.equal(result.movingAverageDiversity, 0);
    assert.doesNotThrow(() => JSON.stringify(result));
  }
});

test('Unicode accents, combining marks, curly apostrophes and contractions', () => {
  const result = analyzeStory("Café cafe\u0301 don't don’t naïve");
  assert.equal(result.words, 5);
  assert.equal(result.uniqueWords, 3);
});

test('counts every phrase occurrence with exact text ranges', () => {
  const text = 'Suddenly suddenly! LITTLE DID THEY KNOW; little\n did they know.';
  const result = analyzeStory(text);
  assert.equal(result.clicheCount, 4);
  const suddenly = result.cliches.find((entry) => entry.phrase === 'suddenly');
  assert.equal(suddenly.count, 2);
  for (const range of suddenly.occurrences) assert.equal(text.slice(range.start, range.end).toLowerCase(), 'suddenly');
});

test('cliche detection respects letter boundaries', () => {
  assert.equal(analyzeStory('unsuddenly suddenlyness').clicheCount, 0);
});

test('evidence ranges are bounded but the occurrence count is complete', () => {
  const result = analyzeStory('suddenly '.repeat(100));
  assert.equal(result.clicheCount, 100);
  assert.equal(result.cliches[0].occurrences.length, 5);
});

test('ignores frequent function words and flags content-word repetition', () => {
  const result = analyzeStory('the and she lantern '.repeat(10));
  assert.deepEqual(result.repeatedWords, [{ word: 'lantern', count: 10 }]);
});

test('repetition threshold is configurable and result ordering is deterministic', () => {
  const result = analyzeStory('zebra zebra apple apple', { repetitionMinimum: 2 });
  assert.deepEqual(result.repeatedWords.map((entry) => entry.word), ['apple', 'zebra']);
});

test('Map counting is safe for object-property words', () => {
  const result = analyzeStory('constructor prototype toString '.repeat(8));
  assert.equal(result.repeatedWordCount, 3);
  assert.equal(result.words, 24);
});

test('moving diversity equals naive sliding-window calculation', () => {
  const words = 'apple berry apple cedar apple berry dogwood elm'.split(' ');
  const size = 3;
  let total = 0;
  for (let i = 0; i <= words.length - size; i++) total += new Set(words.slice(i, i + size)).size / size * 100;
  assert.equal(analyzeStory(words.join(' '), { diversityWindow: size }).movingAverageDiversity,
    Math.round(total / (words.length - size + 1) * 10) / 10);
});

test('fixed-window vocabulary remains comparable for repeated chapters', () => {
  const passage = 'apple berry cedar dogwood elm fir grape hazel iris jasmine '.repeat(15);
  assert.equal(analyzeStory(passage).movingAverageDiversity, analyzeStory(passage.repeat(2)).movingAverageDiversity);
});

test('uses sentence segmentation and detects repeated substantial sentences', () => {
  const sentence = 'The keeper carried a lantern across the silent courtyard.';
  const result = analyzeStory(`${sentence} ${sentence}`);
  assert.equal(result.sentences, 2);
  assert.equal(result.repeatedSentenceCount, 1);
  assert.equal(result.repeatedSentences[0].count, 2);
  assert.equal(result.averageSentenceWords, 9);
});

test('very short or unsupported segmented-language samples are not scored', () => {
  assert.equal(analyzeStory('An excellent story.').score, null);
  assert.ok(analyzeStory('这是中文故事。').warnings.includes('segmentation_language_limit'));
  assert.equal(analyzeStory('这是中文故事。'.repeat(60)).score, null);
});

test('penalties explain the bounded score and repetition lowers it', () => {
  const diverse = Array.from({ length: 60 }, (_, i) => `word${String.fromCharCode(97 + i % 26)}${String.fromCharCode(97 + Math.floor(i / 26))}`).join(' ');
  const result = analyzeStory(diverse);
  assert.equal(result.words, 60);
  assert.equal(result.score, 100);
  const repetitive = analyzeStory('suddenly lantern '.repeat(60));
  assert.ok(repetitive.score < result.score);
  assert.equal(repetitive.score, Math.round(100 - Object.values(repetitive.penalties).reduce((a, b) => a + b, 0)));
});

test('rejects non-string text and malformed, unknown or unsafe limits', () => {
  for (const value of [null, 123, {}, []]) assert.throws(() => analyzeStory(value), TypeError);
  for (const options of [null, [], { misspelled: 1 }, { constructor: 1 }, { maxCharacters: 0 }, { diversityWindow: 1.5 }, { maxCharacters: 1_000_001 }]) {
    assert.throws(() => analyzeStory('text', options));
  }
  assert.throws(() => analyzeStory('a'.repeat(DEFAULT_OPTIONS.maxCharacters + 1)), RangeError);
});

test('maximum-length input produces bounded evidence and does not truncate silently', () => {
  const result = analyzeStory('suddenly '.repeat(22_000));
  assert.equal(result.clicheCount, 22_000);
  assert.equal(result.characters, 198_000);
  assert.equal(result.cliches[0].occurrences.length, 5);
});

test('exported report includes caveats and never invents a score for tiny inputs', () => {
  const report = formatReport(analyzeStory('Suddenly, the candle went out.'));
  assert.match(report, /not scored/);
  assert.match(report, /suddenly \(1\)/);
  assert.match(report, /not a literary rating/);
});
