import { analyzeStory, DEFAULT_OPTIONS, formatReport } from '../lib/analyzer.js';

window.__ModuleLoader__.load({
  id: 'dsh-novel-quality-analyzer',
  factory(require) {
    const React = require('react');
    const { Button, Modal } = require('@deepseek-ai/dsh-client-ui-primitives');
    const h = React.createElement;
    const labels = {
      en: {
        title: 'DSH Novel Quality Analyzer', analyze: 'Analyze writing', close: 'Close analyzer',
        intro: 'Local, English-oriented writing diagnostics. No API calls or draft storage.',
        text: 'Story excerpt', placeholder: 'Paste a chapter or excerpt here…', empty: 'Paste text to see diagnostics.',
        limit: 'Maximum 200,000 characters per excerpt.', pending: 'Analyzing…',
        failure: 'Analysis failed. Try a shorter excerpt.', tooLong: 'Text exceeds the 200,000 character limit. Analyze a shorter excerpt.',
        score: 'Style score', disclaimer: 'Heuristic flags, not a rating of literary quality or AI authorship.',
        few_flags: 'Few style flags', some_flags: 'Some style flags', many_flags: 'Many style flags',
        insufficient_evidence: 'Not scored', short_sample: 'At least 50 words are needed for scoring.',
        segmentation_language_limit: 'Word segmentation is not reliable for this language. No score is assigned.',
        long_sentences: 'Some sentences exceed 35 words; review their clarity in context.',
        words: 'Words', unique: 'Unique words', diversity: 'Moving vocabulary diversity',
        sentenceLength: 'Average sentence length (words)', reading: 'Estimated reading time (minutes)',
        cliches: 'Cliché occurrences', repetitions: 'Repeated content words', duplicates: 'Repeated sentences',
        none: 'None flagged.', occurrence: 'occurrence(s)', occurrences: 'Example positions (UTF-16)',
        copy: 'Copy report', copied: 'Report copied.', copyFailed: 'Clipboard unavailable. Select and copy the report below.',
        report: 'Full report', clear: 'Clear excerpt', context: 'Names, dialogue and deliberate repetition can be intentional.',
      },
      zh: {
        title: 'DSH 小说质量分析器', analyze: '分析写作', close: '关闭分析器',
        intro: '本地分析，以英语文本为主。不调用 API，不保存草稿。',
        text: '故事片段', placeholder: '在此粘贴章节或片段…', empty: '粘贴文本以查看分析。',
        limit: '每段最多 200,000 个字符。', pending: '分析中…', failure: '分析失败，请尝试较短片段。',
        tooLong: '文本超过 200,000 个字符，请分析较短片段。', score: '风格分数',
        disclaimer: '启发式提示，不评判文学质量，也不判断是否由 AI 创作。',
        few_flags: '少量风格提示', some_flags: '部分风格提示', many_flags: '较多风格提示',
        insufficient_evidence: '不评分', short_sample: '至少需要 50 个词才能评分。',
        segmentation_language_limit: '此语言的分词不可靠，因此不评分。',
        long_sentences: '部分句子超过 35 个词，请结合上下文检查清晰度。',
        words: '词数', unique: '不同词数', diversity: '滑动窗口词汇多样性',
        sentenceLength: '平均句长（词）', reading: '预计阅读时间（分钟）',
        cliches: '套话出现次数', repetitions: '重复实词', duplicates: '重复句子',
        none: '未发现提示。', occurrence: '次', occurrences: '示例位置（UTF-16）',
        copy: '复制报告', copied: '已复制报告。', copyFailed: '剪贴板不可用，请选择并复制下方报告。',
        report: '完整报告', clear: '清空片段', context: '人名、对话和刻意重复可能是有意的。',
      },
    };

    function Analyzer({ t }) {
      const [text, setText] = React.useState('');
      const [result, setResult] = React.useState(null);
      const [error, setError] = React.useState('');
      const [copyState, setCopyState] = React.useState('');
      const fieldId = React.useId();

      React.useEffect(() => {
        const timer = setTimeout(() => {
          if (!text.trim()) { setResult(null); return; }
          try { setResult(analyzeStory(text)); }
          catch (error) { setError(t(error instanceof RangeError ? 'tooLong' : 'failure')); }
        }, 250);
        return () => clearTimeout(timer);
      }, [text, t]);

      const update = (value) => { setResult(null); setError(''); setCopyState(''); setText(value); };
      const report = result ? formatReport(result) : '';
      const copy = async () => {
        try { await navigator.clipboard.writeText(report); setCopyState('copied'); }
        catch (error) { setCopyState('copyFailed'); }
      };
      const metric = (key, value) => h('div', { key, style: { padding: '4px 0' } },
        h('span', null, `${t(key)}: `), h('strong', null, String(value)));

      return h('div', { style: { maxHeight: '70vh', overflowY: 'auto', maxWidth: '620px' } },
        h('p', null, t('intro')),
        h('label', { htmlFor: fieldId }, t('text')),
        h('textarea', {
          id: fieldId, 'data-modal-autofocus': '', value: text, rows: 8, placeholder: t('placeholder'),
          onChange: (event) => update(event.target.value),
          style: { width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '6px', color: 'inherit', background: 'transparent' },
        }),
        h('small', null, `${t('limit')} (${text.length.toLocaleString()})`),
        h(Button, { type: 'button', onClick: () => update(''), disabled: !text }, t('clear')),
        error ? h('p', { role: 'alert' }, error) : null,
        h('div', { role: 'status', 'aria-live': 'polite' },
          !result && !error ? h('p', null, t(text.trim() ? 'pending' : 'empty')) : null,
          result ? h('div', null,
            h('h3', null, `${t('score')}: ${result.score ?? '—'}/100 — ${t(result.label)}`),
            h('p', null, t('disclaimer')),
            metric('words', result.words), metric('unique', result.uniqueWords),
            metric('diversity', `${result.movingAverageDiversity}%`),
            metric('sentenceLength', result.averageSentenceWords), metric('reading', result.estimatedReadingMinutes),
            ...result.warnings.map((warning) => h('p', { key: warning }, t(warning))),
            h('h4', null, `${t('cliches')}: ${result.clicheCount}`),
            result.cliches.length ? h('ul', null, ...result.cliches.map((entry) => h('li', { key: entry.phrase },
              `${entry.phrase}: ${entry.count} ${t('occurrence')} — ${t('occurrences')}: `,
              entry.occurrences.map((range) => `${range.start}–${range.end}`).join(', ')))) : h('p', null, t('none')),
            h('h4', null, `${t('repetitions')}: ${result.repeatedWordCount}`),
            result.repeatedWords.length ? h('ul', null, ...result.repeatedWords.map((entry) => h('li', { key: entry.word }, `${entry.word}: ${entry.count}`))) : h('p', null, t('none')),
            h('h4', null, `${t('duplicates')}: ${result.repeatedSentenceCount}`),
            result.repeatedSentences.length ? h('ul', null, ...result.repeatedSentences.map((entry, index) => h('li', { key: index }, `${entry.count}× ${entry.text}`))) : h('p', null, t('none')),
            h('p', null, t('context')),
            h(Button, { type: 'button', onClick: copy }, t('copy')),
            copyState ? h('p', null, t(copyState)) : null,
            h('details', null, h('summary', null, t('report')),
              h('textarea', { 'aria-label': t('report'), readOnly: true, value: report, rows: 8, style: { width: '100%', boxSizing: 'border-box' } }))) : null));
    }

    function Dock({ t }) {
      const [open, setOpen] = React.useState(false);
      return h(React.Fragment, null,
        h(Button, { type: 'button', 'aria-label': t('analyze'), 'aria-expanded': open, onClick: () => setOpen(true) }, '📖 ', t('analyze')),
        open ? h(Modal, { open: true, title: t('title'), closeLabel: t('close'), onClose: () => setOpen(false) }, h(Analyzer, { t })) : null);
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register('novelQuality', labels));
        ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
          name: 'conversation.input.right', id: 'novel-quality-analyzer', order: 100, locale: 'novelQuality',
        }, Dock));
      },
    };
  },
});
