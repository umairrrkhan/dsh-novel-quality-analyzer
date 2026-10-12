# Changelog

## 1.1.0 — 12 October 2026

- Use the npm identity `dsh-novel-quality-analyzer` consistently in the host, browser loader, bundle patch, and documentation.
- Correct ESM metadata and update installation instructions to the upstream `dsh plugin` interface.
- Fix invalid React hook placement and restore an editable input panel with close, clear, and report-copy actions.
- Move analysis into a reusable, dependency-free module shared by the browser build and Node API.
- Count all cliché occurrences with bounded UTF-16 evidence ranges and Unicode letter boundaries.
- Normalize accented words and apostrophes; ignore common function words when reporting repetition.
- Add moving-window vocabulary diversity and repeated-sentence diagnostics.
- Replace invented readability ratings with sentence length and estimated reading time.
- Explain each heuristic score penalty and decline scoring for short or unsupported segmented-language samples.
- Bound analysis size and evidence lists, debounce edits, and dispose pending timers and plugin registrations.
- Add analyzer, React UI, lifecycle, packaging tests, reproducible benchmarks, CI, and a release allowlist.
- Include an MIT license file and implementation/quality report.

## 1.0.0

Initial repository prototype. Its original `@deepseek-harness/novel-quality-analyzer` name has not been verified as an npm release owned by this project. This version changes the installation name and diagnostic response fields; applications consuming the old inline result format should migrate to the documented analysis API.
