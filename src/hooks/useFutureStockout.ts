import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import type { FutureStockoutItem } from '../types';
import { SEED_FUTURE } from '../data/seed';

const USE_DUMMY = import.meta.env.VITE_USE_DUMMY_DATA === 'true';

export function useFutureStockout() {
  const [futureItems, setFutureItems] = useState<FutureStockoutItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (USE_DUMMY) { setFutureItems(SEED_FUTURE); setLoading(false); return; }
    fetch('/api/future-stockouts')
      .then(r => r.json())
      .then((data: FutureStockoutItem[]) => setFutureItems(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const replaceFuture = useCallback(async (next: FutureStockoutItem[]): Promise<void> => {
    const res = await fetch('/api/future-stockouts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
    if (res.ok) setFutureItems(next);
  }, []);

  const resetFuture = useCallback(async (): Promise<void> => {
    // Full reset goes through stockouts DELETE which re-seeds both tables
    const res = await fetch('/api/stockouts', { method: 'DELETE' });
    if (res.ok) {
      const data: FutureStockoutItem[] = await fetch('/api/future-stockouts').then(r => r.json());
      setFutureItems(data);
    }
  }, []);

  const parseFutureCSV = useCallback((text: string): FutureStockoutItem[] | null => {
    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim(),
    });
    if (result.errors.length && result.data.length === 0) return null;
    return result.data.map(row => ({
      partNumber:           row['Part Number']             ?? row['partNumber']           ?? '',
      name:                 row['Name']                    ?? row['name']                 ?? '',
      productLine:          row['Product Line']            ?? row['productLine']          ?? '',
      estimatedWeeksOnHand: Number(row['Estimated Weeks on Hand'] ?? row['estimatedWeeksOnHand'] ?? 0),
    })).filter(i => i.partNumber);
  }, []);

  return { futureItems, loading, replaceFuture, resetFuture, parseFutureCSV };
}
