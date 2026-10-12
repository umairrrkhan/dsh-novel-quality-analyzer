/** Pure, bounded English-oriented writing diagnostics; no network or host access. */
export const DEFAULT_OPTIONS = Object.freeze({
  maxCharacters: 200_000,
  diversityWindow: 100,
  repetitionMinimum: 6,
  minimumScoredWords: 50,
});

const PHRASES = Object.freeze([
  'little did they know', 'unknown to them', 'little did he know',
  'little did she know', 'unbeknownst', 'suddenly', 'out of nowhere', 'before he knew it',
]);
const STOP_WORDS = new Set(('a an and are as at be been being but by can could did do does for from had has have he her hers him his how i if in into is it its me my no not of on or our ours she so than that the their them then there these they this those to too us was we were what when where which who will with would you your yours').split(' '));
const WORD = /\p{L}[\p{L}\p{M}]*(?:['’]\p{L}[\p{L}\p{M}]*)*/gu;
const sentenceSegmenter = new Intl.Segmenter('en', { granularity: 'sentence' });

function tokenize(text) {
  return Array.from(text.matchAll(WORD), (match) => match[0].normalize('NFC').toLowerCase().replaceAll('’', "'"));
}

function optionsFor(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('options must be an object');
  }
  const result = { ...DEFAULT_OPTIONS, ...options };
  for (const [key, value] of Object.entries(result)) {
    if (!Object.hasOwn(DEFAULT_OPTIONS, key) || !Number.isSafeInteger(value) || value < 1) {
      throw new RangeError(`Invalid analysis option: ${key}`);
    }
  }
  if (result.maxCharacters > 1_000_000 || result.diversityWindow > 1000) {
    throw new RangeError('Maximum supported size is 1,000,000 characters and a 1000-word diversity window');
  }
  return result;
}

function movingDiversity(words, size) {
  if (words.length === 0) return 0;
  const window = Math.min(size, words.length);
  const counts = new Map();
  let sum = 0;
  let windows = 0;
  for (let i = 0; i < words.length; i++) {
    counts.set(words[i], (counts.get(words[i]) ?? 0) + 1);
    if (i >= window) {
      const old = words[i - window];
      const count = counts.get(old) - 1;
      if (count === 0) counts.delete(old);
      else counts.set(old, count);
    }
    if (i >= window - 1) { sum += counts.size / window; windows++; }
  }
  return sum / windows * 100;
}

/**
 * Analyze a chapter or excerpt without changing or storing the supplied text.
 * Scores flag writing patterns, not literary quality, originality, or authorship.
 * @param {string} text - Plain text; evidence offsets are UTF-16 string offsets.
 * @param {object} [options] - Positive integer limits from DEFAULT_OPTIONS.
 * @returns {object} JSON-compatible metrics, bounded evidence, and heuristic score.
 */
export function analyzeStory(text, options = {}) {
  if (typeof text !== 'string') throw new TypeError('Story text must be a string');
  const config = optionsFor(options);
  if (text.length > config.maxCharacters) {
    throw new RangeError(`Text exceeds the ${config.maxCharacters.toLocaleString('en')} character limit; analyze a shorter excerpt`);
  }
  const words = tokenize(text);
  const counts = new Map();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  const diversity = movingDiversity(words, config.diversityWindow);
  const repetitions = [...counts]
    .filter(([word, count]) => word.length >= 4 && !STOP_WORDS.has(word) && count >= config.repetitionMinimum)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const cliches = [];
  for (const phrase of PHRASES) {
    const regex = new RegExp(`(?<![\\p{L}\\p{M}])${phrase.replaceAll(' ', '\\s+')}(?![\\p{L}\\p{M}])`, 'giu');
    let count = 0;
    const occurrences = [];
    for (const match of text.matchAll(regex)) {
      count++;
      if (occurrences.length < 5) occurrences.push({ start: match.index, end: match.index + match[0].length });
    }
    if (count) cliches.push({ phrase, count, occurrences });
  }
  const sentenceCounts = new Map();
  let sentences = 0;
  let sentenceWords = 0;
  let longSentences = 0;
  for (const { segment } of sentenceSegmenter.segment(text)) {
    const tokens = tokenize(segment);
    if (!tokens.length) continue;
    sentences++;
    sentenceWords += tokens.length;
    if (tokens.length > 35) longSentences++;
    if (tokens.length >= 8) {
      const key = tokens.join(' ');
      const previous = sentenceCounts.get(key);
      if (previous) previous.count++;
      else sentenceCounts.set(key, { text: segment.trim().slice(0, 160), count: 1 });
    }
  }
  const repeatedSentences = [...sentenceCounts.values()].filter((entry) => entry.count > 1)
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text));
  const clicheCount = cliches.reduce((sum, entry) => sum + entry.count, 0);
  const repeatedExcess = repetitions.reduce((sum, [, count]) => sum + count - config.repetitionMinimum + 1, 0);
  const duplicateExcess = repeatedSentences.reduce((sum, entry) => sum + entry.count - 1, 0);
  const round = (value) => Math.round(value * 10) / 10;
  const penalties = {
    cliches: round(Math.min(35, words.length ? clicheCount / words.length * 1000 * 2 : 0)),
    repetition: round(Math.min(25, words.length ? repeatedExcess / words.length * 100 : 0)),
    diversity: round(Math.min(20, Math.max(0, 55 - diversity) / 55 * 20)),
    duplicateSentences: round(Math.min(20, sentences ? duplicateExcess / sentences * 40 : 0)),
  };
  const warnings = [];
  if (words.length < config.minimumScoredWords) warnings.push('short_sample');
  if (/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Thai}/u.test(text)) warnings.push('segmentation_language_limit');
  if (longSentences) warnings.push('long_sentences');
  const score = warnings.includes('short_sample') || warnings.includes('segmentation_language_limit')
    ? null : Math.max(0, Math.min(100, Math.round(100 - Object.values(penalties).reduce((a, b) => a + b, 0))));
  return {
    schemaVersion: 1, analyzerVersion: '1.1.0', characters: text.length,
    words: words.length, uniqueWords: counts.size,
    vocabularyDiversity: round(words.length ? counts.size / words.length * 100 : 0),
    movingAverageDiversity: round(diversity), diversityWindow: Math.min(config.diversityWindow, words.length),
    sentences, averageSentenceWords: round(sentences ? sentenceWords / sentences : 0), longSentences,
    estimatedReadingMinutes: round(words.length / 200),
    clicheCount, cliches, repeatedWordCount: repetitions.length,
    repeatedWords: repetitions.slice(0, 8).map(([word, count]) => ({ word, count })),
    repeatedSentenceCount: repeatedSentences.length, repeatedSentences: repeatedSentences.slice(0, 5),
    score, penalties, warnings,
    label: score === null ? 'insufficient_evidence' : score >= 80 ? 'few_flags' : score >= 60 ? 'some_flags' : 'many_flags',
  };
}

/** @param {object} result - analyzeStory output. @returns {string} Plain-text diagnostic summary. */
export function formatReport(result) {
  return [
    'DSH Novel Quality Analyzer — local writing diagnostics',
    `Style score: ${result.score ?? 'not scored'} / 100 (heuristic, not a literary rating)`,
    `Words: ${result.words}; unique words: ${result.uniqueWords}; sentences: ${result.sentences}`,
    `Moving vocabulary diversity: ${result.movingAverageDiversity}% (${result.diversityWindow}-word window)`,
    `Average sentence length: ${result.averageSentenceWords} words`,
    `Cliche occurrences: ${result.clicheCount}; repeated content words: ${result.repeatedWordCount}`,
    ...result.cliches.map((entry) => `Phrase: ${entry.phrase} (${entry.count})`),
    ...result.repeatedWords.map((entry) => `Word: ${entry.word} (${entry.count})`),
    ...result.repeatedSentences.map((entry) => `Repeated sentence (${entry.count}): ${entry.text}`),
    'Review flags in context. Names, dialogue, deliberate repetition and genre conventions may be intentional.',
  ].join('\n');
}
