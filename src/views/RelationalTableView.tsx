import { useState, useEffect, useMemo } from 'react';
import type { StockoutItem, FutureStockoutItem } from '../types';
import { SEED_STOCKOUTS, SEED_FUTURE } from '../data/seed';
import styles from './RelationalTableView.module.css';

const USE_DUMMY = import.meta.env.VITE_USE_DUMMY_DATA === 'true';

type SortKey = 'id' | 'name' | 'productLine' | 'leadTime' | 'approxShipDate' | 'escalationOwner' | 'topLevel';
type FutureKey = 'partNumber' | 'name' | 'productLine' | 'estimatedWeeksOnHand';

function SortArrow({ dir }: { dir: 'asc' | 'desc' | null }) {
  if (!dir) return <span className={styles.sortNone}>⇅</span>;
  return <span className={styles.sortActive}>{dir === 'asc' ? '↑' : '↓'}</span>;
}

export default function RelationalTableView() {
  const [stockouts, setStockouts]     = useState<StockoutItem[]>([]);
  const [future, setFuture]           = useState<FutureStockoutItem[]>([]);
  const [loading, setLoading]         = useState(true);

  // current stockouts sort
  const [sortKey, setSortKey]         = useState<SortKey>('leadTime');
  const [sortDir, setSortDir]         = useState<'asc' | 'desc'>('desc');

  // future stockouts sort
  const [fSortKey, setFSortKey]       = useState<FutureKey>('estimatedWeeksOnHand');
  const [fSortDir, setFSortDir]       = useState<'asc' | 'desc'>('asc');

  // search
  const [search, setSearch]           = useState('');

  useEffect(() => {
    if (USE_DUMMY) {
      setStockouts(SEED_STOCKOUTS);
      setFuture(SEED_FUTURE);
      setLoading(false);
      return;
    }
    Promise.all([
      fetch('/api/stockouts').then(r => r.json()),
      fetch('/api/future-stockouts').then(r => r.json()),
    ]).then(([s, f]) => { setStockouts(s); setFuture(f); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Expand stockouts into one row per top-level SKU
  const expandedRows = useMemo(() => {
    const rows: { item: StockoutItem; sku: string | null }[] = [];
    for (const item of stockouts) {
      const tl = Array.isArray(item.topLevel) ? item.topLevel : [];
      if (tl.length === 0) {
        rows.push({ item, sku: null });
      } else {
        for (const sku of tl) {
          rows.push({ item, sku });
        }
      }
    }
    return rows;
  }, [stockouts]);

  // Filter
  const q = search.trim().toLowerCase();
  const filteredRows = useMemo(() => {
    if (!q) return expandedRows;
    return expandedRows.filter(({ item, sku }) =>
      item.id.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.productLine.toLowerCase().includes(q) ||
      item.escalationOwner.toLowerCase().includes(q) ||
      (sku ?? '').toLowerCase().includes(q)
    );
  }, [expandedRows, q]);

  // Sort
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortKey === 'topLevel') {
        av = a.sku ?? '';
        bv = b.sku ?? '';
      } else if (sortKey === 'approxShipDate') {
        av = new Date(a.item.approxShipDate).getTime() || 0;
        bv = new Date(b.item.approxShipDate).getTime() || 0;
      } else {
        av = a.item[sortKey] as string | number;
        bv = b.item[sortKey] as string | number;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortKey, sortDir]);

  const sortedFuture = useMemo(() => {
    return [...future].sort((a, b) => {
      const av = a[fSortKey] as string | number;
      const bv = b[fSortKey] as string | number;
      if (av < bv) return fSortDir === 'asc' ? -1 : 1;
      if (av > bv) return fSortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [future, fSortKey, fSortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }
  function toggleFSort(key: FutureKey) {
    if (fSortKey === key) setFSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setFSortKey(key); setFSortDir('asc'); }
  }

  function Th({ col, label }: { col: SortKey; label: string }) {
    const dir = sortKey === col ? sortDir : null;
    return (
      <th
        className={styles.th}
        aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'}
      >
        <button className={styles.thBtn} onClick={() => toggleSort(col)}>
          {label} <SortArrow dir={dir} />
        </button>
      </th>
    );
  }
  function FTh({ col, label }: { col: FutureKey; label: string }) {
    const dir = fSortKey === col ? fSortDir : null;
    return (
      <th
        className={styles.th}
        aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'}
      >
        <button className={styles.thBtn} onClick={() => toggleFSort(col)}>
          {label} <SortArrow dir={dir} />
        </button>
      </th>
    );
  }

  if (loading) return <div className={styles.loading}>Loading…</div>;

  return (
    <div className={styles.wrap}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Relational Table</h1>
          <p className={styles.pageBlurb}>
            Each row is one gating item → top-level SKU relationship.
            Items with no top-level SKUs appear once with an empty SKU cell.
          </p>
        </div>
        <label className={styles.searchLabel}>
          <span className={styles.srOnly}>Search</span>
          <input
            className={styles.search}
            placeholder="Search part, name, owner, SKU…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search stockout items"
          />
        </label>
      </div>

      {/* ── Current Stockouts ── */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Current Stockouts</span>
          <span className={styles.sectionCount}>{sortedRows.length} rows · {stockouts.length} items</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <Th col="id"               label="Part #" />
                <Th col="name"             label="Name" />
                <Th col="productLine"      label="Product Line" />
                <Th col="leadTime"         label="Lead Time" />
                <Th col="approxShipDate"   label="Est. Ship" />
                <Th col="escalationOwner"  label="Owner" />
                <Th col="topLevel"         label="Top-Level SKU" />
              </tr>
            </thead>
            <tbody>
              {sortedRows.map(({ item, sku }, i) => (
                <tr key={`${item.id}-${sku ?? 'none'}-${i}`} className={styles.row}>
                  <td className={`${styles.td} ${styles.mono}`}>{item.id}</td>
                  <td className={styles.td}>{item.name}</td>
                  <td className={styles.td}>
                    <span className={`${styles.linePill} ${item.productLine === 'Biologics' ? styles.bio : styles.sw}`}>
                      {item.productLine}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.right}`}>
                    <span className={item.leadTime >= 14 ? styles.leadHigh : item.leadTime >= 7 ? styles.leadMed : styles.leadLow}>
                      {item.leadTime}d
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.mono}`}>{item.approxShipDate}</td>
                  <td className={styles.td}>{item.escalationOwner}</td>
                  <td className={`${styles.td} ${styles.mono} ${styles.skuCell}`}>
                    {sku ? <span className={styles.skuPill}>{sku}</span> : <span className={styles.noSku}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Future Stockouts ── */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Future Stockouts</span>
          <span className={styles.sectionCount}>{sortedFuture.length} items</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <FTh col="partNumber"           label="Part #" />
                <FTh col="name"                 label="Name" />
                <FTh col="productLine"          label="Product Line" />
                <FTh col="estimatedWeeksOnHand" label="Wks on Hand" />
              </tr>
            </thead>
            <tbody>
              {sortedFuture.map(item => (
                <tr key={item.partNumber} className={styles.row}>
                  <td className={`${styles.td} ${styles.mono}`}>{item.partNumber}</td>
                  <td className={styles.td}>{item.name}</td>
                  <td className={styles.td}>
                    <span className={`${styles.linePill} ${item.productLine === 'Biologics' ? styles.bio : styles.sw}`}>
                      {item.productLine}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.right}`}>
                    <span className={item.estimatedWeeksOnHand <= 4 ? styles.leadHigh : item.estimatedWeeksOnHand <= 8 ? styles.leadMed : styles.leadLow}>
                      {item.estimatedWeeksOnHand}w
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
