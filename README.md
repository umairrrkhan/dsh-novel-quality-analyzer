# DSH Novel Quality Analyzer

[![npm version](https://img.shields.io/npm/v/dsh-novel-quality-analyzer)](https://www.npmjs.com/package/dsh-novel-quality-analyzer)
[![Plugin checks](https://github.com/umairrrkhan/dsh-novel-quality-analyzer/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/umairrrkhan/dsh-novel-quality-analyzer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A community plugin for **DeepSeek Harness** that analyzes chapters and story excerpts for vocabulary diversity, clichés, repeated words, and repeated sentences.

**Current release: version 1.1.1**

Analysis runs locally in your browser. No API key, LLM request, or analysis subscription is required.

> This plugin provides writing-style diagnostics. It does not judge plot, literary quality, originality, plagiarism, or AI authorship.

## Demo

### Excerpt analysis

The analyzer displays the style score, word counts, and vocabulary diversity alongside your excerpt.

![DSH Novel Quality Analyzer displaying diagnostics for a 90-word excerpt](Screenshot%202026-10-12%20110040.png)

### Short-sample handling

Excerpts with fewer than 50 words show their metrics without assigning a style score.

![DSH Novel Quality Analyzer showing an unscored 44-word excerpt](Screenshot%202026-10-12%20110115.png)

## Installation

Requirements:

- Node.js **22.22.2 or later**; Node 24 LTS is recommended.
- DeepSeek Harness with an existing web-capable profile.
- A modern browser supporting `Intl.Segmenter`.

Install or update the plugin:

```bash
dsh plugin --profile web add dsh-novel-quality-analyzer@latest
```

Replace `web` with your existing profile name.

Inspect the profile configuration and launch it:

```bash
dsh --profile web --dump-config
dsh --profile web
```

Installing the plugin into a new base-only profile does not install the Web UI. For initial Harness setup, follow the [official quick start](https://github.com/deepseek-ai/deepseek-harness#run).

Alternatively, install from GitHub:

```bash
dsh plugin --profile web add github:umairrrkhan/dsh-novel-quality-analyzer
```

The generated browser bundle is committed, so Git installation does not require building the plugin first.

## How to use

1. Open a conversation in DeepSeek Harness.
2. Click **Analyze writing** in the composer toolbar.
3. Paste a chapter or excerpt into **Story excerpt**.
4. Results update after a 250 ms pause.
5. Review the flagged phrases and repetitions in context.
6. Click **Copy report**, or manually copy the full report.
7. Clear or close the panel to discard the excerpt.

The plugin does not read chat history or modify your composer draft.

## Features

| Feature | What it reports |
|---|---|
| Word statistics | Total words and unique words |
| Vocabulary diversity | Moving-average diversity over a default 100-word window |
| Cliché detection | Every matching occurrence, with bounded position evidence |
| Content-word repetition | Frequent words, excluding common function words |
| Repeated sentences | Substantial sentences repeated after token normalization |
| Sentence metrics | Average sentence length and sentences exceeding 35 words |
| Reading time | Estimate based on 200 words per minute |
| Style score | A transparent heuristic with individual penalties |
| Report export | A copyable plain-text diagnostic summary |

The interface includes English and Chinese labels. Text analysis is English-oriented.

## Understanding the results

### Vocabulary diversity

The plugin reports both the raw unique-word ratio and moving-average diversity.

The moving metric uses a sliding 100-word window to reduce the effect of excerpt length. Smaller samples use a shorter effective window.

### Clichés

The current phrase list includes:

- suddenly
- unbeknownst
- out of nowhere
- unknown to them
- before he knew it
- little did they know
- little did he know
- little did she know

All matching occurrences are counted. Up to five example ranges are returned per phrase.

Ranges use JavaScript UTF-16 offsets with an exclusive end position.

### Repetition

Content words are flagged when they:

- Contain at least four letters.
- Occur at least six times by default.
- Are not in the common function-word exclusion list.

Up to eight repeated-word examples are returned.

Repeated-sentence detection considers sentences containing at least eight words and returns up to five examples.

Names, dialogue, recurring motifs, and deliberate repetition may be appropriate. Review every flag in context.

### Style score

The score is calculated as:

```text
100
− cliché penalty
− content-repetition penalty
− low-diversity penalty
− duplicate-sentence penalty
```

The result is clamped to 0–100. Individual penalties are included in the analysis output.

A high score means few configured style flags. It does not establish that a story is well written.

Samples below 50 words are not scored. Detected Chinese, Japanese, or Thai text is also not scored because the tokenizer does not reliably segment those languages.

## Limits and privacy

- Default maximum: **200,000 UTF-16 string units per excerpt**.
- Oversized input is rejected rather than silently truncated.
- Analyze longer novels chapter by chapter.
- Unicode letters, accents, and apostrophes are supported.
- Standalone numbers and punctuation are not counted as words.
- Other languages have not been validated.
- Analysis runs synchronously after debounce; slow devices may pause near the input limit.
- The plugin does not send excerpts to a service or save them to persistent storage.
- Exported reports may contain short snippets from repeated sentences.
- Other Harness features have their own data-handling behavior.

## JavaScript API

The analyzer can also be used outside the Harness interface:

```bash
npm install dsh-novel-quality-analyzer
```

```js
import {
  analyzeStory,
  DEFAULT_OPTIONS,
  formatReport,
} from 'dsh-novel-quality-analyzer/analysis';

const result = analyzeStory(storyText);

console.log(result.words);
console.log(result.score);
console.log(result.penalties);
console.log(formatReport(result));
```

Optional settings:

```js
const result = analyzeStory(storyText, {
  maxCharacters: 200_000,
  diversityWindow: 100,
  repetitionMinimum: 6,
  minimumScoredWords: 50,
});
```

Options must be positive integers. The API supports a maximum character limit of 1,000,000 and a maximum diversity window of 1,000 words.

Invalid input, unknown options, or oversized text throw `TypeError` or `RangeError`. Results are JSON-compatible, and `score` may be `null`.

## Development

```bash
git clone https://github.com/umairrrkhan/dsh-novel-quality-analyzer.git
cd dsh-novel-quality-analyzer
npm ci
npm run check
```

Useful commands:

```bash
npm run build
npm test
npm run benchmark
npm pack --dry-run
```

Edit:

- `lib/analyzer.js` — shared analysis implementation.
- `src/client.js` — Harness browser interface.

Run `npm run build` after editing. Do not manually edit the generated `client.js`.

The package has **zero runtime npm dependencies**. The Harness supplies React and UI primitives; build and test dependencies are development-only.

## Validation

Version 1.1.1 passed:

- **28 automated tests on Node 22.22.2.**
- **28 automated tests on Node 24.**
- Generated browser-bundle consistency checks.
- Package-content checks and artifact upload.
- A fresh public npm installation and analyzer smoke test.
- Verification that the installed README matches the release source.

[View the passing GitHub Actions run](https://github.com/umairrrkhan/dsh-novel-quality-analyzer/actions/runs/38207715772).

Testing uses actual React with a simulated browser and Harness services. Full live-Harness acceptance testing remains unverified.

DeepSeek Harness is a developer preview with changing APIs. The integration was checked against its published conversation and UI-primitives interfaces at version `0.2.0-rc.2`.

## Reports and release notes

- [Implementation and quality report](https://github.com/umairrrkhan/dsh-novel-quality-analyzer/blob/master/docs/REPORT.md)
- [Release verification](https://github.com/umairrrkhan/dsh-novel-quality-analyzer/blob/master/docs/validation/release.json)
- [Changelog](https://github.com/umairrrkhan/dsh-novel-quality-analyzer/blob/master/CHANGELOG.md)
- [Public npm package](https://www.npmjs.com/package/dsh-novel-quality-analyzer)

Version 1.1.1 fixes the unsupported Node 22 test-command flag and includes the updated npm README.

GitHub and npm display separate README copies. Editing this file updates GitHub; updating npm’s packaged README requires publishing another package version.

## License

[MIT](LICENSE).

Maintained by [umairrrkhan](https://github.com/umairrrkhan). This is an independent community plugin, not an official DeepSeek product.
