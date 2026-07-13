import { useRef, useState } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import type { StockoutItem, FutureStockoutItem } from '../types';
import { fileToCSV } from '../utils/fileParser';
import styles from './UploadView.module.css';

const ACCEPT = '.csv,.xlsx,.xls,.pdf';

interface Props {
  onReplace: (items: StockoutItem[]) => void;
  onReset: () => void;
  parseCSV: (text: string) => StockoutItem[] | null;
  currentCount: number;
  onReplaceFuture: (items: FutureStockoutItem[]) => void;
  onResetFuture: () => void;
  parseFutureCSV: (text: string) => FutureStockoutItem[] | null;
  futureCount: number;
}

const CSV_HEADERS = 'Gating Item,Name,Product Line,Lead Time,Approximate Shipping Date,Escalation Owner,Top Level';
const CSV_EXAMPLE = `043-816,Streptavidin-NIR,Simple Western,15,07/17/26,Ryan Katzer,"043-816,CTC-0002,DM-007"`;

const FUTURE_CSV_HEADERS = 'Part Number,Name,Product Line,Estimated Weeks on Hand';
const FUTURE_CSV_EXAMPLE = `040-968,Premix G2 pH 3-10 separation gradient,Simple Western,0.4`;

export default function UploadView({
  onReplace, onReset, parseCSV, currentCount,
  onReplaceFuture, onResetFuture, parseFutureCSV, futureCount,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const futureFileRef = useRef<HTMLInputElement>(null);

  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [preview, setPreview] = useState<StockoutItem[]>([]);

  const [futureDrag, setFutureDrag] = useState(false);
  const [futureStatus, setFutureStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [futurePreview, setFuturePreview] = useState<FutureStockoutItem[]>([]);

  async function handleFile(file: File) {
    setStatus({ type: 'success', msg: 'Reading file…' });
    try {
      const text = await fileToCSV(file);
      const parsed = parseCSV(text);
      if (!parsed || parsed.length === 0) { setStatus({ type: 'error', msg: 'Could not parse file. Check column headers match the template.' }); return; }
      setPreview(parsed);
      setStatus({ type: 'success', msg: `Parsed ${parsed.length} items — review below and confirm to load.` });
    } catch (err) {
      setStatus({ type: 'error', msg: (err as Error).message });
    }
  }

  function confirm() {
    onReplace(preview);
    setStatus({ type: 'success', msg: `Loaded ${preview.length} items successfully.` });
    setPreview([]);
  }

  async function handleFutureFile(file: File) {
    setFutureStatus({ type: 'success', msg: 'Reading file…' });
    try {
      const text = await fileToCSV(file);
      const parsed = parseFutureCSV(text);
      if (!parsed || parsed.length === 0) { setFutureStatus({ type: 'error', msg: 'Could not parse file. Check column headers match the template.' }); return; }
      setFuturePreview(parsed);
      setFutureStatus({ type: 'success', msg: `Parsed ${parsed.length} items — review below and confirm to load.` });
    } catch (err) {
      setFutureStatus({ type: 'error', msg: (err as Error).message });
    }
  }

  function confirmFuture() {
    onReplaceFuture(futurePreview);
    setFutureStatus({ type: 'success', msg: `Loaded ${futurePreview.length} future stockout items successfully.` });
    setFuturePreview([]);
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_HEADERS + '\n' + CSV_EXAMPLE], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'stockout_template.csv';
    a.click();
  }

  function downloadFutureTemplate() {
    const blob = new Blob([FUTURE_CSV_HEADERS + '\n' + FUTURE_CSV_EXAMPLE], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'future_stockout_template.csv';
    a.click();
  }

  return (
    <div className={styles.wrap}>

      {/* ── Current Stockouts ── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.sectionTitle}>Current stockouts</div>
            <div className={styles.sectionSub}>Columns: Gating Item, Name, Product Line, Lead Time, Approximate Shipping Date, Escalation Owner, Top Level</div>
          </div>
          <button onClick={downloadTemplate} className={styles.templateBtn}>
            <Download size={13} /> Download template
          </button>
        </div>

        <div
          className={`${styles.dropzone} ${drag ? styles.dragOver : ''}`}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={24} className={styles.uploadIcon} />
          <span className={styles.dropMain}>Drop your file here or click to browse</span>
          <span className={styles.dropSub}>CSV, Excel (.xlsx / .xls), or PDF</span>
          <input ref={fileRef} type="file" accept={ACCEPT} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>

        {status && (
          <div className={`${styles.status} ${status.type === 'error' ? styles.statusError : styles.statusOk} fade-in`}>
            {status.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {status.msg}
          </div>
        )}

        {preview.length > 0 && (
          <div className={`${styles.previewWrap} fade-in`}>
            <div className={styles.previewHead}>
              <span>{preview.length} items parsed</span>
              <button className="primary" onClick={confirm}>Load this data</button>
            </div>
            <div className={styles.previewTable}>
              <table>
                <thead>
                  <tr><th>Part #</th><th>Name</th><th>Line</th><th>Lead</th><th>Ship date</th><th>Owner</th><th>Top levels</th></tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map(item => (
                    <tr key={item.id}>
                      <td><span className={styles.mono}>{item.id}</span></td>
                      <td>{item.name}</td>
                      <td>{item.productLine}</td>
                      <td>{item.leadTime}d</td>
                      <td>{item.approxShipDate}</td>
                      <td>{item.escalationOwner.split(' ')[1]}</td>
                      <td><span className={styles.mono}>{item.topLevel.length} SKUs</span></td>
                    </tr>
                  ))}
                  {preview.length > 10 && <tr><td colSpan={7} className={styles.more}>+ {preview.length - 10} more rows</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.countRow}>
            <span className={styles.currentCount}>{currentCount}</span>
            <span className={styles.currentLabel}>items currently loaded</span>
          </div>
          <button className={styles.resetBtn} onClick={() => { onReset(); setStatus(null); setPreview([]); }}>
            <RotateCcw size={13} /> Reset to seed data
          </button>
        </div>
      </div>

      {/* ── Future Stockouts ── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.sectionTitle}>Potential future stockouts</div>
            <div className={styles.sectionSub}>Columns: Part Number, Name, Product Line, Estimated Weeks on Hand</div>
          </div>
          <button onClick={downloadFutureTemplate} className={styles.templateBtn}>
            <Download size={13} /> Download template
          </button>
        </div>

        <div
          className={`${styles.dropzone} ${futureDrag ? styles.dragOver : ''}`}
          onDragOver={e => { e.preventDefault(); setFutureDrag(true); }}
          onDragLeave={() => setFutureDrag(false)}
          onDrop={e => { e.preventDefault(); setFutureDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFutureFile(f); }}
          onClick={() => futureFileRef.current?.click()}
        >
          <Upload size={24} className={styles.uploadIcon} />
          <span className={styles.dropMain}>Drop your file here or click to browse</span>
          <span className={styles.dropSub}>CSV, Excel (.xlsx / .xls), or PDF</span>
          <input ref={futureFileRef} type="file" accept={ACCEPT} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFutureFile(f); }} />
        </div>

        {futureStatus && (
          <div className={`${styles.status} ${futureStatus.type === 'error' ? styles.statusError : styles.statusOk} fade-in`}>
            {futureStatus.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {futureStatus.msg}
          </div>
        )}

        {futurePreview.length > 0 && (
          <div className={`${styles.previewWrap} fade-in`}>
            <div className={styles.previewHead}>
              <span>{futurePreview.length} items parsed</span>
              <button className="primary" onClick={confirmFuture}>Load this data</button>
            </div>
            <div className={styles.previewTable}>
              <table>
                <thead>
                  <tr><th>Part #</th><th>Name</th><th>Product Line</th><th>Est. Weeks on Hand</th></tr>
                </thead>
                <tbody>
                  {futurePreview.slice(0, 10).map(item => (
                    <tr key={item.partNumber}>
                      <td><span className={styles.mono}>{item.partNumber}</span></td>
                      <td>{item.name}</td>
                      <td>{item.productLine}</td>
                      <td><span className={styles.mono}>{item.estimatedWeeksOnHand}</span></td>
                    </tr>
                  ))}
                  {futurePreview.length > 10 && <tr><td colSpan={4} className={styles.more}>+ {futurePreview.length - 10} more rows</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.countRow}>
            <span className={styles.currentCount}>{futureCount}</span>
            <span className={styles.currentLabel}>items currently loaded</span>
          </div>
          <button className={styles.resetBtn} onClick={() => { onResetFuture(); setFutureStatus(null); setFuturePreview([]); }}>
            <RotateCcw size={13} /> Reset to seed data
          </button>
        </div>
      </div>

    </div>
  );
}
