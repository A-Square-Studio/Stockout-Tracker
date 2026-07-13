import { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import type { StockoutItem } from '../types';
import styles from './SearchBar.module.css';

interface Props {
  items: StockoutItem[];
  onSelect?: (item: StockoutItem) => void;
}

export default function SearchBar({ items, onSelect }: Props) {
  const [q, setQ] = useState('');
  const [result, setResult] = useState<StockoutItem | 'not-found' | null>(null);
  const [sugs, setSugs] = useState<StockoutItem[]>([]);
  const [activeSug, setActiveSug] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  function matchedTopLevel(item: StockoutItem, query: string): string | null {
    const s = query.toLowerCase();
    return item.topLevel.find(t => t.toLowerCase().includes(s)) ?? null;
  }

  function match(item: StockoutItem, query: string) {
    const s = query.toLowerCase();
    return item.id.toLowerCase().includes(s) ||
      item.name.toLowerCase().includes(s) ||
      item.topLevel.some(t => t.toLowerCase().includes(s));
  }

  function onInput(val: string) {
    setQ(val);
    setResult(null);
    setActiveSug(-1);
    if (!val.trim()) { setSugs([]); return; }
    setSugs(items.filter(i => match(i, val)).slice(0, 6));
  }

  function search(override?: StockoutItem) {
    setSugs([]);
    if (override) { setResult(override); onSelect?.(override); return; }
    const exact = items.find(i =>
      i.id.toLowerCase() === q.toLowerCase() ||
      i.name.toLowerCase() === q.toLowerCase() ||
      i.topLevel.some(t => t.toLowerCase() === q.toLowerCase())
    );
    if (exact) { setResult(exact); onSelect?.(exact); return; }
    const partial = items.filter(i => match(i, q));
    if (partial.length === 1) { setResult(partial[0]); onSelect?.(partial[0]); return; }
    setResult('not-found');
  }

  function clear() { setQ(''); setResult(null); setSugs([]); }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { setActiveSug(a => Math.min(a + 1, sugs.length - 1)); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { setActiveSug(a => Math.max(a - 1, 0)); e.preventDefault(); }
    else if (e.key === 'Enter') {
      if (activeSug >= 0 && sugs[activeSug]) { setQ(sugs[activeSug].id); search(sugs[activeSug]); }
      else search();
    } else if (e.key === 'Escape') clear();
  }

  const ownerInitials = (name: string) => name.split(' ').map(n => n[0]).join('');
  const ownerColor = (name: string) => {
    if (name.includes('Katzer')) return 'var(--coral)';
    if (name.includes('Babb')) return 'var(--teal)';
    return 'var(--purple)';
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <div className={styles.inputWrap}>
          <Search size={14} className={styles.icon} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search part number, name, or top-level SKU…"
            value={q}
            onChange={e => onInput(e.target.value)}
            onKeyDown={onKey}
            className={styles.input}
          />
          {q && <button className={styles.clear} onClick={clear}><X size={12} /></button>}
        </div>
        <button className="primary" onClick={() => search()}>Check stock</button>
      </div>

      {sugs.length > 0 && (
        <ul className={styles.sugs}>
          {sugs.map((item, i) => {
            const via = matchedTopLevel(item, q);
            const directMatch = item.id.toLowerCase().includes(q.toLowerCase()) || item.name.toLowerCase().includes(q.toLowerCase());
            return (
              <li
                key={item.id}
                className={`${styles.sugItem} ${i === activeSug ? styles.sugActive : ''}`}
                onMouseDown={() => { setQ(item.id); search(item); }}
              >
                <div className={styles.sugMain}>
                  <span className={styles.sugId}>{item.id}</span>
                  <span className={styles.sugName}>{item.name}</span>
                </div>
                {!directMatch && via && (
                  <span className={styles.sugVia}>top-level: {via}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {result && result !== 'not-found' && (
        <div className={`${styles.card} fade-in`}>
          <div className={styles.cardTop}>
            <div>
              <div className={styles.cardId}>{result.id}</div>
              <div className={styles.cardName}>{result.name}</div>
            </div>
            <span className={styles.badgeOut}>Out of stock</span>
          </div>
          <div className={styles.hr} />
          <div className={styles.meta}>
            <div className={styles.metaCell}>
              <div className={styles.metaLabel}>Lead time</div>
              <div className={styles.metaValue}>{result.leadTime} days</div>
            </div>
            <div className={styles.metaCell}>
              <div className={styles.metaLabel}>Est. ship date</div>
              <div className={styles.metaValue}>{result.approxShipDate}</div>
            </div>
            <div className={styles.metaCell}>
              <div className={styles.metaLabel}>Product line</div>
              <div className={styles.metaValue}>{result.productLine}</div>
            </div>
            <div className={styles.metaCell}>
              <div className={styles.metaLabel}>Escalation owner</div>
              <div className={styles.metaValue}>
                <span className={styles.avatar} style={{ background: ownerColor(result.escalationOwner) }}>
                  {ownerInitials(result.escalationOwner)}
                </span>
                {result.escalationOwner}
              </div>
            </div>
          </div>
          {result.topLevel.length > 0 && (
            <>
              <div className={styles.hr} />
              <div className={styles.tops}>
                <div className={styles.topsLabel}>Gated top-level SKUs ({result.topLevel.length})</div>
                <div className={styles.pills}>
                  {result.topLevel.map(t => {
                    const isSearched = t.toLowerCase() === q.toLowerCase();
                    return (
                      <span key={t} className={`${styles.pill} ${t === result.id ? styles.pillSelf : ''} ${isSearched ? styles.pillMatch : ''}`}>{t}</span>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {result === 'not-found' && (
        <div className={`${styles.notFound} fade-in`}>
          <span className={styles.badgeIn}>In stock</span>
          <span><strong>{q}</strong> — not found in stockout list.</span>
        </div>
      )}
    </div>
  );
}
