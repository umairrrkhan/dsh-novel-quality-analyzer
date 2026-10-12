# DSH Novel Quality Analyzer

Local writing diagnostics for **DeepSeek Harness**. Inspect a chapter or excerpt for vocabulary diversity, cliché occurrences, repeated content words and repeated sentences, then copy an evidence-backed report.

Published on npm: **[dsh-novel-quality-analyzer](https://www.npmjs.com/package/dsh-novel-quality-analyzer)**, version **1.1.1**. This is an independent community plugin, not an official DeepSeek product. It uses no LLM, API key, network request, or runtime npm dependency. The harness supplies React and its UI primitives.

## Quick start

Install the published package into an existing Harness web profile:

```sh
dsh plugin --profile web add dsh-novel-quality-analyzer
```

Then open a conversation, click **Analyze writing**, and paste your excerpt.

## Install in DeepSeek Harness

Use Node **22.22.2 or later**; Node 24 LTS is recommended. DeepSeek Harness is a fast-moving developer preview. This integration was checked against upstream source revision `d743267388641bc76f17c45ce8b4c231aed1d32c`, including its published-module and slot fixtures. The npm conversation/UI-primitives interfaces at 0.2.0-rc.2 were also checked.

Install the public npm release:

```sh
dsh plugin --profile web add dsh-novel-quality-analyzer
dsh --profile web --dump-config
dsh --profile web
```

Replace `web` with your existing web-capable profile. Installing into a new base-only profile does not itself install the Web UI. If you have not installed the harness, follow its [official quick start](https://github.com/deepseek-ai/deepseek-harness#run).

Alternatively, install this public GitHub repository into an existing profile:

```sh
dsh plugin --profile web add github:umairrrkhan/dsh-novel-quality-analyzer
```

The generated `client.js` is committed so Git installs do not depend on an install-time build. The old `dsh bundle install`/`bundle enable` instructions and `@local` patch alias have been replaced with the current upstream plugin interface.

## Use

1. Open a conversation and click **Analyze writing** in the composer toolbar.
2. Paste a chapter or excerpt into **Story excerpt**. Results update after a 250 ms pause.
3. Review the metrics and occurrence evidence in context.
4. Use **Copy report**, or select the full report if clipboard access is unavailable.
5. Clear or close the panel to discard its text. The plugin does not read chat history or alter the composer draft.

Analysis runs in browser memory. It does not send text to a service, write it to storage, or call DeepSeek. Other harness features have their own data behavior. A copied report includes bounded text snippets from repeated sentences.

## What the results mean

- **Words and unique words:** Unicode letter tokens with accent and apostrophe normalization; punctuation and standalone numbers are not words.
- **Moving vocabulary diversity:** Mean unique-word ratio over a sliding 100-word window, rather than comparing entire chapters using only raw type/token ratio. The effective window is shorter for small samples.
- **Clichés:** Every occurrence of a small, documented English phrase list, with the first five UTF-16 `[start,end)` ranges per phrase. A flagged phrase is an editing prompt, not necessarily bad writing.
- **Repeated content words:** Words of at least four letters occurring at least six times; common function words are excluded. Names, dialogue and intentional motifs may still be flagged. At most eight examples are returned.
- **Repeated sentences:** Token-normalized sentences of at least eight words appearing more than once; at most five examples are returned.
- **Sentence length and reading time:** Sentence segmentation via `Intl.Segmenter('en')`; reading time assumes 200 words/minute. These are estimates, not comprehension scores.
- **Style score:** `100 - cliche penalty - repetition penalty - diversity penalty - duplicate-sentence penalty`, clamped to 0–100. All penalties are returned. This measures the configured patterns, **not plot, originality, grammar, character development, literary quality or AI authorship**.

Samples below 50 words are unscored. Detected Chinese/Japanese/Thai text is also unscored because this tokenizer does not segment those languages reliably. The diagnostics are English-oriented; other languages have not been validated.

The default limit is **200,000 JavaScript string characters** (UTF-16 units). Oversized excerpts are rejected, never silently truncated. Analyze long novels chapter by chapter. Processing is synchronous after debounce, so slow devices may still pause near the limit.

## JavaScript API

```js
import { analyzeStory, formatReport } from 'dsh-novel-quality-analyzer/analysis';

const result = analyzeStory(storyText);
console.log(result.words, result.score, result.penalties);
console.log(formatReport(result));
```

`analyzeStory(text, options)` accepts positive integer overrides for `maxCharacters` (maximum 1,000,000), `diversityWindow` (maximum 1,000), `repetitionMinimum`, and `minimumScoredWords`. Defaults are exported as `DEFAULT_OPTIONS`. Invalid text, unknown options and oversized inputs throw `TypeError` or `RangeError`. The UI uses the default limits. Output is JSON-compatible; score may be `null`.

## Develop and verify

```sh
npm ci
npm run check
npm pack --dry-run
```

Edit `src/client.js` and `lib/analyzer.js`, then run `npm run build`. Do not edit generated `client.js` directly. React and DOM/build tooling are development dependencies only. Unit and UI tests use Node's test runner, actual React, and a simulated browser/host; they do not substitute for a live harness acceptance test.

The [implementation and quality report](docs/REPORT.md) records fixes, benchmarks, tests, compatibility evidence and limits. Benchmarks use synthetic English prose and do not establish editorial accuracy.

## Publish

The npm profile URL is not a publishing credential. Authenticate as `umair64066`, verify the account, then publish the reviewed artifact:

```sh
npm login
npm whoami
npm run check
npm publish --access public
```

Do not place registry credentials in this repository. Publication requires account authorization and may require two-factor authentication. Before publishing any release, verify both supported Node versions, inspect the packed README, and check a fresh registry installation after publication. See [release verification](docs/validation/release.json) for the observed status.

## License

[MIT](LICENSE).

## Release compatibility

Version 1.1.1 fixes the Node 22 test-command failure in version 1.1.0 and ships the current README in the npm archive. Use the latest patch version when installing. GitHub and npm display separate README copies; npm receives its copy when a new version is published.
