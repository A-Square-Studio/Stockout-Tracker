import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import type { StockoutItem } from '../types';
import styles from './AskAI.module.css';

interface Props { items: StockoutItem[]; }

const SUGGESTIONS = [
  'Which items have lead times over 10 days?',
  'What SKUs are blocked by Streptavidin-NIR?',
  'Which stockouts does Ryan Katzer own?',
];

export default function AskAI({ items }: Props) {
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setAnswer(data.answer);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function renderAnswer(text: string) {
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((p, i) =>
      p.startsWith('`') && p.endsWith('`')
        ? <code key={i} className={styles.code}>{p.slice(1, -1)}</code>
        : <span key={i}>{p}</span>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <div className={styles.inputWrap}>
          <Sparkles size={14} className={styles.icon} />
          <input
            type="text"
            placeholder="Ask anything about the stockout data…"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask(q)}
            className={styles.input}
            disabled={loading}
          />
        </div>
        <button className="primary" onClick={() => ask(q)} disabled={loading}>
          {loading ? <Loader2 size={14} className={styles.spin} /> : 'Ask'}
        </button>
      </div>

      {!answer && !loading && !error && (
        <div className={styles.suggestions}>
          {SUGGESTIONS.map(s => (
            <button key={s} className={styles.chip} onClick={() => { setQ(s); ask(s); }}>{s}</button>
          ))}
        </div>
      )}

      {error && <div className={`${styles.error} fade-in`}>{error}</div>}

      {answer && (
        <div className={`${styles.answer} fade-in`}>
          <div className={styles.answerLabel}>
            <Sparkles size={12} /> Claude Fable
          </div>
          <div className={styles.answerText}>{renderAnswer(answer)}</div>
        </div>
      )}
    </div>
  );
}
