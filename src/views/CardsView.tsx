import { useState } from 'react';
import { Printer } from 'lucide-react';
import type { StockoutItem, FutureStockoutItem } from '../types';
import SearchBar from '../components/SearchBar';
import styles from './CardsView.module.css';

interface Props {
  items: StockoutItem[];
  futureItems: FutureStockoutItem[];
  loading?: boolean;
}

const LINES = ['All', 'Simple Western', 'Biologics'];

function ownerColor(name: string) {
  if (name.includes('Katzer')) return 'var(--coral)';
  if (name.includes('Babb')) return 'var(--teal)';
  return 'var(--purple)';
}

function riskLevel(lead: number): { label: string; color: string } {
  if (lead >= 20) return { label: 'High', color: 'var(--red)' };
  if (lead >= 10) return { label: 'Med', color: 'var(--amber)' };
  return { label: 'Low', color: 'var(--teal)' };
}

function weeksColor(weeks: number): string {
  if (weeks <= 0.5) return 'var(--red)';
  if (weeks <= 1.5) return 'var(--amber)';
  return 'var(--teal)';
}

const LEGEND_ITEMS = [
  { term: 'Gating Item', def: 'Item that is currently stocked out and may be potentially impacting customer orders.' },
  { term: 'Top Level', def: 'The finished goods impacted by the delay. These are the SKUs customers order.' },
  { term: 'Approximate Shipping Date', def: 'The expected date that this product will ship out to customers.' },
  { term: 'Escalation Owner', def: 'Who to contact for escalations regarding the SKUs in question.' },
];

const MTO_ITEMS = [
  { pn: '040-024', desc: 'pI Standard, 4.0' },
  { pn: '040-025', desc: 'pI Standard, 4.2' },
  { pn: '040-026', desc: 'pI Standard, 4.4' },
  { pn: '040-027', desc: 'pI Standard, 4.9' },
  { pn: '040-028', desc: 'pI Standard, 5.5' },
  { pn: '040-029', desc: 'pI Standard, 6.0' },
  { pn: '040-030', desc: 'pI Standard, 6.4' },
  { pn: '040-031', desc: 'REAG, pI STD, 7.0' },
  { pn: '040-032', desc: 'pI Standard, 7.3' },
  { pn: '040-644', desc: 'pI Standard Ladder 1' },
  { pn: '040-646', desc: 'pI Standard Ladder 3' },
  { pn: '040-649', desc: 'Sample Diluent' },
  { pn: '040-790', desc: 'pI Standard, 9.7' },
  { pn: '040-972', desc: 'Premix G2, pH 5-8 (nested)' },
  { pn: '040-973', desc: 'Premix G2, pH 5-8 Pharmalyte' },
  { pn: '040-974', desc: 'Premix G2, Servalyt pH 5-8 gradient' },
  { pn: '041-036', desc: 'pI Standard, 8.4' },
  { pn: '041-050', desc: 'Blocking Solution, 200ml' },
  { pn: '041-052', desc: 'Antibody Wash, 200ml' },
  { pn: '041-054', desc: 'Final Wash, 50ml' },
  { pn: '041-061', desc: 'Red (Goat anti Rabbit) 100ul' },
  { pn: '041-063', desc: 'Green (Goat anti Mouse) 100ul' },
  { pn: '041-064', desc: 'Blue (Donkey anti Chicken) 100ul' },
  { pn: '041-066', desc: 'Immobilon-FL Membrane, 10-pack' },
  { pn: '041-731', desc: 'SW Leveling Anolyte' },
  { pn: '041-732', desc: 'SW Leveling Catholyte' },
  { pn: '048-968', desc: 'Premix G2, pH 3-10' },
];

const DECISION_STEPS = [
  {
    n: 1,
    question: 'On the active stockout list (Section 3)?',
    sub: 'Is the SKU — or one of its top-level SKUs — currently stocked out?',
    action: 'Quote the Approximate Shipping Date and loop in the escalation owner.',
    highlight: 'Approximate Shipping Date',
  },
  {
    n: 2,
    question: 'On the item-specific exception list (Section 1)?',
    sub: 'Does the SKU have a special lead time (e.g. PS-MC02-F = 30 days)?',
    action: 'Quote the special lead time.',
    highlight: 'special lead time',
  },
  {
    n: 3,
    question: 'An MTO item (Section 5)?',
    sub: 'Is it on the made-to-order list?',
    action: 'Quote the 4-week production lead time — not 3 days.',
    highlight: '4-week production lead time',
  },
  {
    n: 4,
    question: 'On the future-stockout watchlist (Section 4)?',
    sub: 'At risk per Weeks on Hand?',
    action: 'Process normally, but flag the risk and monitor inventory. Higher priority if also an A Item.',
    highlight: 'flag the risk',
  },
  {
    n: 5,
    question: 'None of the above?',
    sub: 'Clean, in-stock, standard item.',
    action: 'Standard lead time: 3 working days domestic; + international scheduling for international orders.',
    highlight: 'Standard lead time',
  },
];


export default function CardsView({ items, futureItems }: Props) {
  const [line, setLine] = useState('All');
  const [sort, setSort] = useState<'lead' | 'id'>('lead');
  const [legendOpen, setLegendOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);

  const filtered = items
    .filter(i => line === 'All' || i.productLine === line)
    .sort((a, b) => sort === 'lead' ? b.leadTime - a.leadTime : a.id.localeCompare(b.id));

  return (
    <div className={styles.wrap}>
      {/* Decision Sequence */}
      <div className={styles.legendPanel}>
        <button className={styles.legendToggle} onClick={() => setDecisionOpen(o => !o)}>
          <span className={styles.legendToggleLabel}>How To Apply It — Decision Sequence</span>
          <span className={styles.legendChevron} style={{ transform: decisionOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
        </button>
        {decisionOpen && (
          <div className={styles.decisionBody}>
            <p className={styles.decisionIntro}>For each incoming order, check in this order. <strong>First match wins.</strong></p>
            <ol className={styles.decisionList}>
              {DECISION_STEPS.map(step => (
                <li key={step.n} className={styles.decisionItem}>
                  <span className={styles.decisionNum}>{step.n}</span>
                  <div className={styles.decisionContent}>
                    <div className={styles.decisionQ}>{step.question}</div>
                    <div className={styles.decisionSub}>{step.sub}</div>
                    <div className={styles.decisionAction}>
                      {step.action.split(step.highlight).map((part, i, arr) => (
                        i < arr.length - 1
                          ? <span key={i}>{part}<span className={styles.decisionHighlight}>{step.highlight}</span></span>
                          : <span key={i}>{part}</span>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className={styles.legendPanel}>
        <button className={styles.legendToggle} onClick={() => setLegendOpen(o => !o)}>
          <span className={styles.legendToggleLabel}>Definitions</span>
          <span className={styles.legendChevron} style={{ transform: legendOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
        </button>
        {legendOpen && (
          <ul className={styles.legendList}>
            {LEGEND_ITEMS.map(({ term, def }) => (
              <li key={term} className={styles.legendItem}>
                <span className={styles.legendTerm}>{term}</span>
                <span className={styles.legendSep}>–</span>
                <span className={styles.legendDef}>{def}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <SearchBar items={items} />
        <div className={styles.controls}>
          <div className={styles.pills}>
            {LINES.map(l => (
              <button key={l} className={`${styles.pill} ${line === l ? styles.active : ''}`} onClick={() => setLine(l)}>{l}</button>
            ))}
          </div>
          <select className={styles.sort} value={sort} onChange={e => setSort(e.target.value as 'lead' | 'id')}>
            <option value="lead">Sort: Lead time</option>
            <option value="id">Sort: Part number</option>
          </select>
          <button className={styles.pdfBtn} onClick={() => window.print()} title="Download PDF">
            <Printer size={13} /> Download PDF
          </button>
        </div>
      </div>

      {/* Current stockout cards */}
      <div className={styles.printSectionHeader}>Current Stockouts</div>
      <div className={styles.grid}>
        {filtered.map(item => {
          const risk = riskLevel(item.leadTime);
          const selfRef = item.topLevel.includes(item.id);
          const others = item.topLevel.filter(t => t !== item.id);
          return (
            <div key={item.id} className={`${styles.card} fade-in`}>
              <div className={styles.cardHead}>
                <div>
                  <div className={styles.partNum}>{item.id}</div>
                  <div className={styles.partName}>{item.name}</div>
                </div>
                <span className={styles.riskBadge} style={{ color: risk.color, borderColor: risk.color, background: `${risk.color}18` }}>
                  {risk.label}
                </span>
              </div>
              <div className={styles.hr} />
              <div className={styles.meta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Lead time</span>
                  <span className={styles.metaVal} style={{ color: risk.color }}>{item.leadTime}d</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Ships</span>
                  <span className={styles.metaVal}>{item.approxShipDate}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Line</span>
                  <span className={styles.metaVal}>{item.productLine}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Owner</span>
                  <span className={styles.metaVal}>
                    <span className={styles.dot} style={{ background: ownerColor(item.escalationOwner) }} />
                    {item.escalationOwner.split(' ')[1]}
                  </span>
                </div>
              </div>
              {others.length > 0 && (
                <>
                  <div className={styles.hr} />
                  <div className={styles.topSection}>
                    <span className={styles.topsLabel}>Top level ({selfRef ? others.length + 1 : others.length})</span>
                    <div className={styles.topPills}>
                      {selfRef && <span className={`${styles.topPill} ${styles.self}`}>{item.id}</span>}
                      {others.slice(0, 6).map(t => <span key={t} className={styles.topPill}>{t}</span>)}
                      {others.length > 6 && <span className={styles.more}>+{others.length - 6}</span>}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Potential Future Stockouts */}
      {futureItems.length > 0 && (
        <div className={styles.futureSection}>
          <div className={styles.futureHeader}>
            <h2 className={styles.futureTitle}>Potential Future Stockouts</h2>
            <p className={styles.futureBlurb}>
              See below for items that could potentially stockout in the next few days/week.
              The team is working on expediting these and should be used as reference only.
            </p>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Part Number</th>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Product Line</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Est. Weeks on Hand</th>
                </tr>
              </thead>
              <tbody>
                {futureItems.map((item, i) => {
                  const color = weeksColor(item.estimatedWeeksOnHand);
                  return (
                    <tr key={item.partNumber} className={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                      <td className={`${styles.td} ${styles.tdMono}`}>{item.partNumber}</td>
                      <td className={styles.td}>{item.name}</td>
                      <td className={styles.td}>{item.productLine}</td>
                      <td className={`${styles.td} ${styles.tdRight}`}>
                        <span className={styles.weeksBadge} style={{ color, background: `${color}18`, borderColor: `${color}40` }}>
                          {item.estimatedWeeksOnHand.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Reference Sections */}
      <div className={styles.refSection}>
        {/* MTO Items */}
        <div className={styles.refBlock}>
          <div className={styles.defSectionHead}>
            <div className={styles.defSectionLeft}>
              <span className={styles.defSectionNum}>5</span>
              <span className={styles.defSectionTitle}>Made-To-Order (MTO) Items</span>
              <span className={styles.defSectionBadge}>{MTO_ITEMS.length} ITEMS</span>
            </div>
            <span className={styles.defSectionNote}>QUOTE 4 WEEKS — PRODUCTION LEAD TIME</span>
          </div>
          <p className={styles.defSectionBlurb}>
            Manufactured on demand — never shipped from the shelf. When one appears on an order, quote the 4-week production lead time, not the standard 3 days.
          </p>
          <div className={styles.mtoTableWrap}>
            <table className={styles.mtoTable}>
              <thead>
                <tr>
                  <th className={styles.mtoTh}>P/N</th>
                  <th className={styles.mtoTh}>Description</th>
                  <th className={styles.mtoTh}>P/N</th>
                  <th className={styles.mtoTh}>Description</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.ceil(MTO_ITEMS.length / 2) }, (_, i) => {
                  const left = MTO_ITEMS[i];
                  const right = MTO_ITEMS[i + Math.ceil(MTO_ITEMS.length / 2)];
                  return (
                    <tr key={left.pn} className={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                      <td className={`${styles.mtoTd} ${styles.mtoPn}`}>{left.pn}</td>
                      <td className={styles.mtoTd}>{left.desc}</td>
                      {right ? (
                        <>
                          <td className={`${styles.mtoTd} ${styles.mtoPn} ${styles.mtoMidBorder}`}>{right.pn}</td>
                          <td className={styles.mtoTd}>{right.desc}</td>
                        </>
                      ) : (
                        <><td className={styles.mtoTd} /><td className={styles.mtoTd} /></>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
