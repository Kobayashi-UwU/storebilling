import { useMemo, useState } from 'react';
import ItemCard from '../components/ItemCard';
import CreateItemModal from '../components/CreateItemModal';
import EditItemModal from '../components/EditItemModal';
import { useItems } from '../hooks/useItems';
import type { Item } from '../types';

export default function ItemsPage() {
  const { items, loading, addItem, patchItem, removeItem } = useItems();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => item.name.toLowerCase().includes(term));
  }, [items, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Inventory</p>
          <h2 className="text-2xl font-semibold text-slate-900">Manage Items</h2>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white"
        >
          + Add New Item
        </button>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search Items</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm"
        />
      </div>

      {loading && <p className="text-sm text-slate-500">Loading items…</p>}
      {!loading && !items.length && <p className="text-sm text-slate-500">No items yet. Create one!</p>}
      {!loading && items.length > 0 && !filteredItems.length && (
        <p className="text-sm text-slate-500">No items match that search.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <ItemCard key={item.id} item={item} onClick={() => setEditingItem(item)} />
        ))}
      </div>

      <CreateItemModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={addItem} />
      <EditItemModal
        open={Boolean(editingItem)}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onUpdate={patchItem}
        onDelete={removeItem}
      />
    </div>
  );
}
