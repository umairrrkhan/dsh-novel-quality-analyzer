# DSH Novel Quality Analyzer: implementation and quality report

**Author:** umairrrkhan

**Date:** 12 October 2026

**Published release:** `dsh-novel-quality-analyzer@1.1.1`

**Repository:** https://github.com/umairrrkhan/dsh-novel-quality-analyzer

## Patch 1.1.1: CI and README repair

The Node 22 GitHub Actions job failed because the test command used `--test-isolation=none`, which Node 22 does not support. The command now uses the standard `node --test` runner, and the CI matrix allows both supported versions to finish independently. The generated browser artifact is also checked against source. All 28 tests, benchmarks, and package checks passed locally on both Node 22.22.2 and Node 24.19.0. Both GitHub Actions matrix jobs also passed, including generated-bundle verification, packaging, and artifact upload: [verified CI run](https://github.com/umairrrkhan/dsh-novel-quality-analyzer/actions/runs/38207300160).

The GitHub README had been updated after publishing 1.1.0, leaving npm with its older archive copy. Patch 1.1.1 includes the current public package name, quick start, compatible Node versions, and release information in the archive. A regression check requires the README version and npm link to match package metadata. Version 1.1.1 is now publicly available as the npm latest tag. Its registry integrity matches the reviewed archive, and a fresh public install verified both analysis and an exact match of the updated README.

## Outcome

The original prototype has been converted into a working, testable DeepSeek Harness writing-diagnostics bundle. Its browser interface accepts excerpts, produces evidence-backed metrics, and exports a report. The same dependency-free analyzer is available to JavaScript consumers. The browser code uses the harness's React and UI primitives; analyzed text is not sent to a service or persisted by this plugin.

The name is now consistently `dsh-novel-quality-analyzer`, matching the repository. The original `@deepseek-harness` namespace is not the author's personal npm namespace; using an unscoped project name avoids implying ownership of that organization. **Version 1.1.0 is published publicly on [npm](https://www.npmjs.com/package/dsh-novel-quality-analyzer)** under `umair64066`. The public registry returned the expected version and its SHA-512 integrity matched the reviewed archive. A fresh registry install and analyzer/host-export smoke test passed without supplying npm login credentials. Source and report changes are pushed to the public repository. Authentication was completed through npm browser login and its publishing 2FA flow; no credentials are included in the source or package.

## What was repaired

| Original issue | Resulting behavior |
|---|---|
| Host file used ESM without explicit package metadata | `type: module`, tested host exports and analysis subpath |
| Package, patch and browser loader used conflicting identities | All runtime identities reference the published project name |
| React state hook was called in plugin activation | Hooks run inside mounted components; activation only registers effects and slots |
| Panel had no editable story field, and empty results hid the interface | Textarea remains visible with instructions, actionable errors and close/clear controls |
| Phrase matching counted distinct phrase types once | Every occurrence is counted; first five exact UTF-16 ranges per phrase provide evidence |
| ASCII word matching mishandled accented words and apostrophes | Unicode letters/marks and normalized contractions are counted consistently |
| Frequent function words produced noisy repetition flags | Common function words are excluded; content words have a configurable occurrence threshold |
| Whole-text vocabulary ratio penalized long samples disproportionately | Fixed-window moving-average diversity is reported alongside the raw ratio |
| Readability number was invented from length and diversity thresholds | Sentence length and an explicit 200-words/minute reading-time estimate replace it |
| Score was capped at 80 and hid its component penalties | A bounded 0–100 heuristic returns each penalty and declines unsupported samples |
| No bounded analysis size, tests, package allowlist, or license file | Excerpt limits, evidence limits, automated tests, release checks and MIT file are included |
| Installation instructions used an obsolete bundle command | Instructions follow the current upstream `dsh plugin --profile … add` interface |

The new response fields and npm name differ from the prototype. Consumers of the old inline result format need to migrate; the root host activation still exports `apply()`.

## How it works

1. The bundle patch activates `index.js` under the project package name. The host half is intentionally minimal.
2. The generated browser module registers through `window.__ModuleLoader__.load()` and contributes an additive control to `conversation.input.right`.
3. Cordis locale and slot effects are scoped to the plugin lifecycle. A React component owns the open/closed dialog state; a separate component owns the excerpt and result.
4. After 250 ms without an edit, the shared analyzer validates the input size, normalizes word tokens, counts vocabulary/frequencies, scans phrase occurrences, and segments sentences.
5. A rolling frequency map computes moving-average type/token diversity over a default 100-word window. Sentence signatures identify substantial duplicates.
6. Results expose counts, bounded examples, sentence metrics, score penalties and warnings. React renders text as text, not HTML. The copy action exports a plain-text diagnostic summary with a manual-copy fallback.
7. Clearing or closing discards the excerpt. Pending analysis timers and registration effects are removed on unmount/disposal. No chat history is read, and no composer draft is changed.

`lib/analyzer.js` is the single implementation used by both the Node API and browser build. `src/client.js` is maintained source; `client.js` is reproducibly generated with esbuild and committed for Git-based installation. There are **zero runtime npm dependencies**. Build, React and simulated-browser tooling are development-only packages locked in `package-lock.json`.

## Score and evidence interpretation

For eligible samples, score is 100 minus four rounded penalties, clamped to 0–100:

| Penalty | Rule | Maximum |
|---|---|---:|
| Clichés | Two points per occurrence per 1,000 words | 35 |
| Content repetition | Excess flagged occurrences as a percentage of words | 25 |
| Low moving diversity | Proportional penalty below 55% moving-window diversity | 20 |
| Duplicate sentences | Duplicate excess divided by sentence count, multiplied by 40 | 20 |

The phrase list includes “suddenly”, “unbeknownst”, “out of nowhere”, “unknown to them”, “before he knew it”, and the three “little did … know” variants in the source. Matching uses Unicode letter boundaries and flexible whitespace. Reported offsets use JavaScript UTF-16 indices, not grapheme counts or byte positions.

The default repetition threshold is six occurrences of a non-function word at least four letters long. Repeated names, genre conventions, dialogue and deliberate motifs may be legitimate. At most eight repeated-word examples, five duplicated-sentence examples, and five ranges per phrase are returned; overall counts are not truncated.

Samples below 50 words, or containing detected Chinese/Japanese/Thai script, receive `score: null`. The tokenizer is not a validated multilingual word segmenter. English sentence segmentation is supplied by `Intl.Segmenter`; numbers, code and punctuation are not treated as prose words.

This score does **not** assess plot, character consistency, factuality, grammatical correctness, originality, emotional effectiveness, literary merit, plagiarism or AI authorship. A high score means few configured style flags, not necessarily a good novel. Editorial quality has not been calibrated against human reviewers.

## Verification results

**27 tests passed** using Node 24.19.0 on Linux x64. Analyzer tests cover empty input, Unicode normalization, apostrophes, complete phrase counts, evidence offsets, substring boundaries, bounded evidence, function-word filtering, deterministic ordering, safe Map counting, moving-window parity, length comparison, duplicate sentences, unsupported samples, score decomposition, option validation, maximum size and report output.

React UI tests run actual React 19.3.0 in jsdom 30.1.2 with simulated harness slots, locale registration and UI primitives. They cover activation without invalid hooks, toolbar/dialog opening, a visible textarea for empty input, typing and analysis, clipboard success/failure, oversized input, HTML-like content, short samples, clear/close privacy behavior and registration disposal. These tests exercise behavior, but **do not launch the full DeepSeek Harness application**.

Package tests verify importable host ESM, no runtime dependencies, matching package/loader/patch names, public access configuration and analyzer/package version agreement. The release checker verifies required files, excludes tests/work directories/credentials from the tarball, and caps its compressed size at 100 KB. The packed archive was installed into an isolated project with scripts disabled and development dependencies omitted; imports from the root and analysis subpath passed a phrase-count smoke test. The archive contains nine allowlisted files and is about 16 KB compressed.

### Performance

| Excerpt size | Words | Median analysis time | p95 | JSON result size |
|---|---:|---:|---:|---:|
| 10,000 characters | 1,653 | 1.37 ms | 1.90 ms | 974 bytes |
| 50,000 characters | 8,265 | 5.80 ms | 6.56 ms | 988 bytes |
| 200,000 characters | 33,058 | 22.68 ms | 28.98 ms | 999 bytes |

These measurements use synthetic repeated English prose, one warm-up and ten measured calls per size. p95 uses the nearest-rank 95th percentile, which is the maximum for ten samples. They measure only the pure analyzer, excluding dialog rendering, user typing, cold module load and the complete harness. They are not an editorial-accuracy result or a guarantee for slower hardware. Default analysis is limited to 200,000 UTF-16 units; the configurable API limit is at most 1,000,000. Oversized inputs fail explicitly.

Work and memory scale with the excerpt, vocabulary and unique sentence signatures. Phrase scanning has a fixed eight-phrase dictionary, moving diversity is linear using a rolling map, and frequency/example sorting depends on the number of unique flagged entries. No model weights are loaded. Processing remains synchronous after debounce, so near-limit excerpts can pause slow browser devices; chapter-by-chapter use is recommended.

### Harness compatibility evidence

The module/slot pattern was reviewed against official source revision `d743267388641bc76f17c45ce8b4c231aed1d32c` and its `fixture-input-extension`/`fixture-live-client` examples. The npm-published conversation and UI-primitives packages at **0.2.0-rc.2** were also inspected: they declare `conversation.input.right` as a list slot and expose compatible `Button`/`Modal` interfaces. This is source/interface evidence, not end-to-end acceptance of every host version.

Upstream references:

- https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/docs/user/develop/basic/publish.md
- https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/docs/subsystems/slots.md
- https://github.com/deepseek-ai/deepseek-harness/tree/d743267388641bc76f17c45ce8b4c231aed1d32c/apps/web/tests/fixtures/plugins/fixture-input-extension

The harness is a developer preview with changing APIs. Perform a live acceptance check on the actual installed harness: open a conversation, verify the toolbar control, paste an excerpt, inspect counts, copy a report, close/reopen, and disable/re-enable the bundle. Desktop compatibility and all browser versions have not been established.

## How good is it?

The implementation is substantially better than the original as a **local editing aid**: its interface is operable, its metrics have explicit definitions, its evidence is reviewable, its size is bounded, and key regressions have automated coverage. It is small and requires no analysis subscription or API key.

Its present strength is deterministic, transparent style diagnostics. Its main limitation is that mechanical word/phrase statistics cannot judge a story's creative quality. The phrase and function-word lists are intentionally small and English-focused; the score weights are heuristics rather than a validated editorial model. The current validation establishes software behavior and synthetic performance, not human-rating accuracy.

Next improvements should prioritize a live harness acceptance test and a labeled set of real excerpts reviewed by writers/editors. Evaluate false-positive flags, genre dependence, named-character repetition and score agreement before claiming literary-quality accuracy. Browser worker processing and more language-specific tokenization are possible later extensions; neither is implemented in this release.

## Release and installation

Current release: **1.1.1**. The source commit is `176bb6afcfc36d8667a25bc104ecfb4ab06e2821`; the compressed archive is 17,208 bytes. The [current release verification](validation/release.json) and [CI evidence](validation/ci-1.1.1.json) confirm both supported Node jobs and the installed README. The 1.1.0 record below is historical and its original evidence is retained in [release-1.1.0.json](validation/release-1.1.0.json).

The public npm package identity is `dsh-novel-quality-analyzer@1.1.0`. It was built from commit `2a0b2d6d41fe59da217fc9573e6e0740a549fa74`; this post-publication report updates the packaging-time status contained in that immutable archive. The compressed release is 16,458 bytes (49,590 bytes unpacked), with nine allowlisted files and no runtime dependencies. See [release verification](validation/release.json) for artifact integrity and registry details. Both registry and built-client Git installation paths are documented.

See the root README for profile installation, use, JavaScript API, reproduction commands and the publishing login procedure. CI runs checks on Node 22.22.2 and Node 24. Both jobs passed for the 1.1.1 source commit; later runs can be checked in the repository Actions page.
