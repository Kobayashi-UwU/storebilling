import { useCallback, useEffect, useState } from 'react';
import type { Item } from '../types';
import { createItem, deleteItem, fetchItems, updateItem } from '../lib/api';

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchItems();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addItem = useCallback(
    async (payload: Parameters<typeof createItem>[0]) => {
      const created = await createItem(payload);
      setItems((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const patchItem = useCallback(
    async (id: string, payload: Parameters<typeof updateItem>[1]) => {
      const updated = await updateItem(id, payload);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    },
    []
  );

  const removeItem = useCallback(async (id: string) => {
    await deleteItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { items, loading, error, refresh: load, addItem, patchItem, removeItem };
}
