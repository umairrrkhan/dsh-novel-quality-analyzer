window.__ModuleLoader__.load({
  id: '@local/novel-quality-analyzer',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    
    function analyzeStory(text) {
      const words = text.toLowerCase().match(/\b\w+\b/g) || [];
      const totalWords = words.length;
      const uniqueWords = new Set(words).size;
      const vocabularyDiversity = totalWords > 0 ? (uniqueWords / totalWords) * 100 : 0;
      
      const slopPhrases = [
        'little did they know', 'unknown to them', 'little did he know',
        'unbeknownst', 'suddenly', 'out of nowhere', 'before he knew it'
      ];
      
      const slopCount = slopPhrases.reduce((c, p) => c + (text.toLowerCase().includes(p) ? 1 : 0), 0);
      const wordCounts = {};
      words.forEach(w => { wordCounts[w] = (wordCounts[w] || 0) + 1; });
      const repeatedWords = Object.values(wordCounts).filter(c => c > 5).length;
      const topRepeated = Object.entries(wordCounts)
        .filter(([w,c]) => c > 5)
        .sort((a,b) => b[1]-a[1]).slice(0,5).map(([w,c]) => `${w}(${c})`);
      
      const score = Math.max(0, Math.min(100, 50 + 
        (vocabularyDiversity - 40) / 60 * 30 - 
        Math.min(slopCount * 8, 40) - 
        Math.min(repeatedWords * 3, 30)
      );
      
      let label = 'Needs Work', color = '#FF1744';
      if (score >= 80) { label = 'Excellent'; color = '#00C853'; }
      else if (score >= 60) { label = 'Good'; color = '#FFD600'; }
      else if (score >= 40) { label = 'Fair'; color = '#FFAB00'; }
      
      return { 
        score: Math.round(score), label, color,
        vocabulary: vocabularyDiversity.toFixed(1), 
        words: totalWords, slopCount, repeatedWords, topRepeated,
        readability: Math.round(100 - (totalWords > 2000 ? 20 : 0) - (vocabularyDiversity < 50 ? 15 : 0))
      };
    }
    
    function Analyzer({ onClose }) {
      const [text, setText] = React.useState('');
      const [result, setResult] = React.useState(null);
      
      React.useEffect(() => {
        const t = setTimeout(() => {
          if (text.trim().length > 10) setResult(analyzeStory(text));
          else setResult(null);
        }, 300);
        return () => clearTimeout(t);
      }, [text]);
      
      if (!result) return h('div', { style: { padding: '10px', color: '#fff', fontSize: '13px', textAlign: 'center' } }, 'Paste text to analyze');
      
      return h('div', { style: { 
        background: 'rgba(30,30,40,0.96)', 
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '12px', 
        padding: '12px', 
        minWidth: '280px',
        maxWidth: '360px',
        position: 'absolute',
        top: '-200px',
        left: '0',
        zIndex: 1000
      }},
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' } },
          h('span', { style: { fontSize: '12px', fontWeight: '600', color: '#fff' } }, '✨ Quality Score'),
          h('button', { 
            style: { background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px' }, 
            onClick: onClose 
          }, '✕')
        ),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' } },
          h('div', { style: { 
            width: '50px', height: '50px', borderRadius: '50%', 
            background: `conic-gradient(${result.color} ${result.score}%, #333 ${result.score}%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }},
            h('div', { style: { 
              width: '40px', height: '40px', borderRadius: '50%', 
              background: '#1e1e28', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: result.color, fontWeight: 'bold', fontSize: '14px'
            }}, `${result.score}`)
          ),
          h('div', { style: { flex: 1 } },
            h('div', { style: { color: result.color, fontSize: '14px', fontWeight: '700' } }, result.label),
            h('div', { style: { fontSize: '11px', color: '#888', marginTop: '2px' } }, 
              `W: ${result.words} | Vocab: ${result.vocabulary}% | Read: ${result.readability}/100`)
          )
        ),
        result.slopCount > 0 && h('div', { style: { fontSize: '11px', color: '#FFAB00', marginBottom: '8px' } }, 
          `⚠️ ${result.slopCount} cliché phrase(s) found`
        ),
        result.repeatedWords > 0 && h('div', { style: { fontSize: '11px', color: '#f44336', marginBottom: '8px' } }, 
          `🔄 ${result.repeatedWords} word(s) overused (${result.topRepeated.slice(0,3).join(', ')})`
        )
      );
    }
    
    return {
      inject: ['slots'],
      apply(ctx) {
        const [isOpen, setIsOpen] = React.useState(false);
        
        function Toggle() {
          return h('button', {
            style: {
              padding: '6px 10px',
              fontSize: '12px',
              background: isOpen ? '#667eea' : 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            },
            onClick: () => setIsOpen(!isOpen)
          }, isOpen ? '📖 Analyzing...' : '📖 Analyze');
        }
        
        function Dock() {
          return h('div', { style: { position: 'relative' } },
            h(Toggle),
            isOpen && h(Analyzer, { onClose: () => setIsOpen(false) })
          );
        }
        
        ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
          name: 'conversation.input.right',
          id: 'novel-quality-analyzer',
          order: 100
        }, Dock));
      }
    };
  }
});
