import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Bill, CreateBillPayload } from '../types';
import { createBill, deleteBill, fetchBills, updateBill } from '../lib/api';

export function useBills(date: string) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBills(date);
      setBills(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const totalRevenue = useMemo(() => bills.reduce((sum, bill) => sum + bill.final_price, 0), [bills]);

  const addBill = useCallback(
    async (payload: CreateBillPayload) => {
      const created = await createBill(payload);
      setBills((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const editBill = useCallback(async (id: string, payload: CreateBillPayload) => {
    const updated = await updateBill(id, payload);
    setBills((prev) => prev.map((bill) => (bill.id === id ? updated : bill)));
    return updated;
  }, []);

  const removeBill = useCallback(async (id: string) => {
    await deleteBill(id);
    setBills((prev) => prev.filter((bill) => bill.id !== id));
  }, []);

  return { bills, loading, error, refresh: load, totalRevenue, addBill, editBill, removeBill };
}
