import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import type { StockoutItem } from '../types';
import { SEED_STOCKOUTS } from '../data/seed';

const USE_DUMMY = import.meta.env.VITE_USE_DUMMY_DATA === 'true';

export function useStockout() {
  const [items, setItems] = useState<StockoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (USE_DUMMY) { setItems(SEED_STOCKOUTS); setLoading(false); return; }
    fetch('/api/stockouts')
      .then(r => r.json())
      .then((data: StockoutItem[]) => setItems(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const replace = useCallback(async (next: StockoutItem[]): Promise<void> => {
    const res = await fetch('/api/stockouts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
    if (res.ok) {
      setItems(next);
      setLastUpdated(new Date());
    }
  }, []);

  const reset = useCallback(async (): Promise<void> => {
    const res = await fetch('/api/stockouts', { method: 'DELETE' });
    if (res.ok) {
      const data: StockoutItem[] = await fetch('/api/stockouts').then(r => r.json());
      setItems(data);
      setLastUpdated(null);
    }
  }, []);

  const parseCSV = useCallback((text: string): StockoutItem[] | null => {
    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim(),
    });
    if (result.errors.length && result.data.length === 0) return null;
    return result.data.map(row => ({
      id:              row['Gating Item']          ?? row['id']              ?? '',
      name:            row['Name']                 ?? row['name']            ?? '',
      productLine:     row['Product Line']         ?? row['productLine']     ?? '',
      leadTime:        Number(row['Lead Time']     ?? row['leadTime']        ?? 0),
      approxShipDate:  row['Approximate Shipping Date'] ?? row['approxShipDate'] ?? '',
      escalationOwner: row['Escalation Owner']     ?? row['escalationOwner'] ?? '',
      topLevel:        (row['Top Level']           ?? row['topLevel']        ?? '')
                         .split(',').map(s => s.trim()).filter(Boolean),
    })).filter(i => i.id);
  }, []);

  return { items, loading, replace, reset, parseCSV, lastUpdated };
}
