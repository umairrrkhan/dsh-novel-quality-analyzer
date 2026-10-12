/** Host half of the Novel Quality Analyzer bundle; the Client module owns the rendering. */
export const name = 'novel-quality-analyzer';
export function apply() {}

export { analyzeStory, DEFAULT_OPTIONS, formatReport } from './lib/analyzer.js';
