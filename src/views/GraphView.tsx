import { useEffect, useRef, useState } from 'react';
import { Printer } from 'lucide-react';
import type { StockoutItem } from '../types';
import SearchBar from '../components/SearchBar';
import styles from './GraphView.module.css';

interface Props { items: StockoutItem[]; }

interface Node { x: number; y: number; label: string; name: string; r: number; type: 'gate' | 'top'; selfRef?: boolean; hasExternals?: boolean; }

const TEAL   = '#1D9E75';
const GREEN  = '#22c55e';
const PURPLE = '#7F77DD';
const CORAL  = '#D85A30';
const LINE   = '#2e3240';
const LINE_H = '#7F77DD88';
const TEXT       = '#e2e4ec';
const TEXT_PRINT = '#111827';
const LINE_PRINT = '#94a3b8';

export default function GraphView({ items }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);
  const widthRef    = useRef(680);
  const nodesRef    = useRef<Record<string, Node>>({});
  const edgesRef    = useRef<{ from: string; to: string }[]>([]);

  const [hovered,     setHovered]     = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [cursorPos,   setCursorPos]   = useState<{ x: number; y: number } | null>(null);

  const GPAD = 50;

  function buildGraph(W: number) {
    const allTopIds = [...new Set(items.flatMap(d => d.topLevel.filter(t => t !== d.id)))];
    const nodes: Record<string, Node> = {};
    const gatingCount = items.length;
    const gateX = Math.round(W * 0.24);
    const topX  = Math.round(W - 90);

    items.forEach((d, i) => {
      const y = GPAD + i * ((640 - GPAD * 2) / Math.max(gatingCount - 1, 1));
      const externals = d.topLevel.filter(t => t !== d.id);
      nodes[d.id] = { x: gateX, y, label: d.id, name: d.name, r: 7, type: 'gate', selfRef: d.topLevel.includes(d.id), hasExternals: externals.length > 0 };
    });

    const topYPad = 28;
    const topSpacing = (640 - topYPad * 2) / Math.max(allTopIds.length - 1, 1);
    allTopIds.forEach((id, i) => {
      nodes[id] = { x: topX, y: topYPad + i * topSpacing, label: id, name: id, r: 4, type: 'top' };
    });

    nodesRef.current = nodes;
    edgesRef.current = items.flatMap(d =>
      d.topLevel.filter(t => t !== d.id).map(t => ({ from: d.id, to: t }))
    );
  }

  function getActiveId() { return highlighted || hovered; }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const DPR = window.devicePixelRatio || 2;
    const W = widthRef.current;
    const H = canvas.height / DPR;

    ctx.clearRect(0, 0, W * DPR, H * DPR);
    ctx.save();
    ctx.scale(DPR, DPR);

    const active = getActiveId();
    const nodes  = nodesRef.current;
    const edges  = edgesRef.current;

    const connectedIds = new Set<string>();
    if (active) {
      connectedIds.add(active);
      edges.forEach(e => {
        if (e.from === active) connectedIds.add(e.to);
        if (e.to === active)   connectedIds.add(e.from);
      });
    }

    // Edges
    edges.forEach(e => {
      const a = nodes[e.from], b = nodes[e.to];
      if (!a || !b) return;
      const isConn = active ? (connectedIds.has(e.from) && connectedIds.has(e.to)) : false;
      const cx = a.x + (b.x - a.x) * 0.5;
      ctx.beginPath();
      ctx.moveTo(a.x + a.r, a.y);
      ctx.bezierCurveTo(cx, a.y, cx, b.y, b.x - b.r, b.y);
      ctx.strokeStyle = isConn ? LINE_H : active ? '#1e2130' : LINE;
      ctx.lineWidth   = isConn ? 1.5 : 0.5;
      ctx.stroke();
    });

    // Nodes
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textBaseline = 'middle';

    Object.values(nodes).forEach(n => {
      const isActive = active === n.label;
      const isConn   = active ? connectedIds.has(n.label) : false;
      ctx.globalAlpha = active ? (isConn ? 1 : 0.2) : 1;

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + (isActive ? 2 : 0), 0, Math.PI * 2);
      const gateColor = (n.selfRef && n.hasExternals) ? CORAL : GREEN;
      ctx.fillStyle = n.type === 'gate' ? gateColor : PURPLE;
      ctx.fill();

      if (isActive) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = n.type === 'gate' ? gateColor : PURPLE;

        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      ctx.fillStyle = TEXT;
      ctx.textAlign  = n.type === 'gate' ? 'end' : 'start';
      ctx.fillText(n.label, n.x + (n.type === 'gate' ? -(n.r + 6) : n.r + 6), n.y);
      ctx.globalAlpha = 1;
    });

    ctx.restore();
  }

  function setupCanvas(W: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const DPR = window.devicePixelRatio || 2;
    const nodes = nodesRef.current;
    const H = Object.keys(nodes).length
      ? Math.max(...Object.values(nodes).map(n => n.y)) + 60
      : 660;

    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
  }

  function refresh(W: number) {
    buildGraph(W);
    setupCanvas(W);
    draw();
  }

  // Resize observer — defer work to next animation frame to avoid
  // "ResizeObserver loop completed with undelivered notifications" browser warning
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let raf = 0;
    const observer = new ResizeObserver(entries => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const W = Math.floor(entries[0].contentRect.width);
        if (W < 10) return;
        widthRef.current = W;
        refresh(W);
      });
    });
    observer.observe(el);
    return () => { observer.disconnect(); cancelAnimationFrame(raf); };
  }, [items]);

  // Redraw on hover / highlight change
  useEffect(() => { draw(); }, [hovered, highlighted]);

  function getHit(mx: number, my: number): string | null {
    const nodes = nodesRef.current;
    for (const [id, n] of Object.entries(nodes)) {
      if (Math.hypot(mx - n.x, my - n.y) <= n.r + 8) return id;
    }
    return null;
  }

  function toCanvas(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { mx: 0, my: 0 };
    const rect = canvas.getBoundingClientRect();
    const W = widthRef.current;
    const H = canvas.height / (window.devicePixelRatio || 2);
    return {
      mx: (e.clientX - rect.left) * (W / rect.width),
      my: (e.clientY - rect.top)  * (H / rect.height),
    };
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const { mx, my } = toCanvas(e);
    setHovered(getHit(mx, my));
    const wrap = wrapRef.current;
    if (wrap) {
      const rect = wrap.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }

  function onClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const { mx, my } = toCanvas(e);
    const hit = getHit(mx, my);
    setHighlighted(prev => prev === hit ? null : hit);
  }

  const active     = getActiveId();
  const activeNode = active ? nodesRef.current[active] : null;
  const activeItem = active ? items.find(i => i.id === active) : null;
  const connectedEdges = active
    ? edgesRef.current.filter(e => e.from === active || e.to === active)
    : [];

  function drawForPrint() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const DPR = window.devicePixelRatio || 2;
    const W = widthRef.current;
    const H = canvas.height / DPR;

    ctx.clearRect(0, 0, W * DPR, H * DPR);
    ctx.save();
    ctx.scale(DPR, DPR);

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const nodes = nodesRef.current;
    const edges = edgesRef.current;

    // Edges
    edges.forEach(e => {
      const a = nodes[e.from], b = nodes[e.to];
      if (!a || !b) return;
      const cx = a.x + (b.x - a.x) * 0.5;
      ctx.beginPath();
      ctx.moveTo(a.x + a.r, a.y);
      ctx.bezierCurveTo(cx, a.y, cx, b.y, b.x - b.r, b.y);
      ctx.strokeStyle = LINE_PRINT;
      ctx.lineWidth = 0.75;
      ctx.stroke();
    });

    // Nodes + labels
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textBaseline = 'middle';

    Object.values(nodes).forEach(n => {
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      const gateColor = (n.selfRef && n.hasExternals) ? CORAL : GREEN;
      ctx.fillStyle = n.type === 'gate' ? gateColor : PURPLE;
      ctx.fill();

      ctx.fillStyle = TEXT_PRINT;
      ctx.textAlign = n.type === 'gate' ? 'end' : 'start';
      ctx.fillText(n.label, n.x + (n.type === 'gate' ? -(n.r + 6) : n.r + 6), n.y);
    });

    ctx.restore();
  }

  function downloadPDF() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawForPrint();
    const img = canvas.toDataURL('image/png');
    draw(); // restore screen colours
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Graph — Stockout Tracker</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #0f1117; display: flex; justify-content: center; }
      img { width: 100%; height: auto; display: block; }
      @media print { body { margin: 0; } }
    </style></head><body><img src="${img}" /></body></html>`);
    win.document.close();
    win.addEventListener('load', () => { win.focus(); win.print(); });
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div className={styles.topRow}>
          <SearchBar items={items} onSelect={item => setHighlighted(item.id)} />
          <button className={styles.pdfBtn} onClick={downloadPDF} title="Download PDF">
            <Printer size={13} /> Download PDF
          </button>
        </div>
        <div className={styles.legend}>
          <span><span className={styles.dot} style={{ background: TEAL }}   /> Gating item</span>
          <span><span className={styles.dot} style={{ background: PURPLE }} /> Top level SKU</span>
          <span><span className={styles.dot} style={{ background: CORAL }}  /> Self-referencing</span>
          <span className={styles.hint}>Click node to pin · hover to explore</span>
        </div>
      </div>

      <div className={styles.canvasWrap} ref={wrapRef}>
        <canvas
          ref={canvasRef}
          onMouseMove={onMouseMove}
          onMouseLeave={() => setHovered(null)}
          onClick={onClick}
          style={{ cursor: hovered ? 'pointer' : 'default', display: 'block' }}
        />

        {active && activeNode && (highlighted || cursorPos) && (
          <div
            className={`${styles.tooltip} ${highlighted ? styles.tooltipPinned : ''} fade-in`}
            style={highlighted ? undefined : {
              left: cursorPos!.x + 16,
              top:  Math.max(8, cursorPos!.y - 24),
            }}
          >
            <div className={styles.ttId}>{active}</div>
            {activeItem && <div className={styles.ttName}>{activeItem.name}</div>}
            <div className={styles.ttMeta}>
              {activeItem && (
                <><span>{activeItem.leadTime}d lead</span><span>·</span><span>{activeItem.approxShipDate}</span></>
              )}
            </div>
            {connectedEdges.length > 0 && (
              <div className={styles.ttConns}>{connectedEdges.length} connection{connectedEdges.length > 1 ? 's' : ''}</div>
            )}
            {highlighted && (
              <button className={styles.ttClear} onClick={() => setHighlighted(null)}>Clear</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
