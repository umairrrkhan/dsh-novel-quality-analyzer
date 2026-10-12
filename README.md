# Novel Quality Analyzer

Analyze your stories and novels for quality, vocabulary diversity, clichés ("slop" phrases), and repetitive words directly inside DeepSeek Harness.

## Features

- **Quality Score (0-100):** Get a rating based on text metrics.
- **Vocabulary Diversity:** Track unique vs total words.
- **Cliché Detection:** Flags overused phrases like "suddenly", "little did they know", etc.
- **Repetition Alert:** Highlights words used too frequently.

## Installation

### For Developers (Local Testing)

1.  Clone the repo or download the folder.
2.  Navigate to your DeepSeek Harness profile directory.
3.  Copy this folder into `profile/local/bundles/` (or your workspace).
4.  Install the bundle:
    ```bash
    dsh bundle install /path/to/novel-quality-analyzer
    ```

### For End Users (Published)

If published to npm:

```bash
pnpm add @deepseek-harness/novel-quality-analyzer
dsh bundle enable @deepseek-harness/novel-quality-analyzer
```

## How to Use

1.  Open DeepSeek Harness.
2.  Look for the **"📖 Analyze"** button in the chat composer toolbar.
3.  Paste your story text into the text box.
4.  View the quality score and metrics in the floating panel.

## License

MIT
