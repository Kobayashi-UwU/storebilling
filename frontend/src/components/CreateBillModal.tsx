import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import type { Bill, CreateBillPayload, Item } from '../types';
import { formatCurrency } from '../utils/number';

interface DraftItem {
  item: Item;
  quantity: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  items: Item[];
  billDate: string;
  onCreate: (payload: CreateBillPayload) => Promise<void>;
  onCreateNewItem: () => void;
  mode?: 'create' | 'edit';
  initialBill?: Bill | null;
  onUpdate?: (id: string, payload: CreateBillPayload) => Promise<void>;
}

export default function CreateBillModal({
  open,
  onClose,
  items,
  billDate,
  onCreate,
  onCreateNewItem,
  mode = 'create',
  initialBill,
  onUpdate
}: Props) {
  const [search, setSearch] = useState('');
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [finalTotalInput, setFinalTotalInput] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [prefilledBillId, setPrefilledBillId] = useState<string | null>(null);
  const isEditMode = mode === 'edit' && Boolean(initialBill);
  const activeBillDate = isEditMode && initialBill ? initialBill.bill_date : billDate;

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(term));
  }, [items, search]);
  const visibleItems = useMemo(() => filteredItems.slice(0, 6), [filteredItems]);

  const subtotal = useMemo(() => draftItems.reduce((sum, entry) => sum + entry.quantity * entry.item.price, 0), [draftItems]);
  const finalTotal = finalTotalInput ? Number(finalTotalInput) : subtotal;

  const addItem = (item: Item) => {
    setDraftItems((prev) => {
      const existing = prev.find((entry) => entry.item.id === item.id);
      if (existing) {
        return prev.map((entry) => (entry.item.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry));
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setDraftItems((prev) =>
      prev
        .map((entry) => (entry.item.id === itemId ? { ...entry, quantity: Math.max(1, quantity) } : entry))
        .filter((entry) => entry.quantity > 0)
    );
  };

  const removeItem = (itemId: string) => {
    setDraftItems((prev) => prev.filter((entry) => entry.item.id !== itemId));
  };

  const resetState = () => {
    setDraftItems([]);
    setSearch('');
    setFinalTotalInput('');
    setPrefilledBillId(null);
  };

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }
    if (isEditMode && initialBill) {
      if (prefilledBillId === initialBill.id) {
        return;
      }
      const mapped: DraftItem[] = initialBill.items
        .map((line) => {
          const match = items.find((item) => item.id === line.item_id);
          const baseItem: Item | null =
            match ??
            (line.item_id
              ? {
                  id: line.item_id,
                  name: line.name,
                  price: line.price_per_unit,
                  stock: line.quantity,
                  image_base64: line.image_base64,
                  created_at: undefined,
                  updated_at: undefined
                }
              : null);
          if (!baseItem) return null;
          return { item: baseItem, quantity: line.quantity };
        })
        .filter((entry): entry is DraftItem => Boolean(entry));
      setDraftItems(mapped);
      setFinalTotalInput(String(initialBill.final_price));
      setSearch('');
      setPrefilledBillId(initialBill.id);
    } else {
      resetState();
    }
  }, [open, isEditMode, initialBill, items, prefilledBillId]);

  const handleSave = async () => {
    if (!draftItems.length) return;
    setSaving(true);
    try {
      const payload: CreateBillPayload = {
        billDate: activeBillDate,
        items: draftItems.map((entry) => ({
          itemId: entry.item.id,
          quantity: entry.quantity,
          pricePerUnit: entry.item.price
        })),
        finalPrice: finalTotal
      };
      if (isEditMode && initialBill && onUpdate) {
        await onUpdate(initialBill.id, payload);
      } else {
        await onCreate(payload);
      }
      resetState();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <>
      <button
        type="button"
        onClick={() => {
          resetState();
          onClose();
        }}
        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={!draftItems.length || saving}
        onClick={handleSave}
        className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? 'Saving…' : isEditMode ? 'Update Bill' : 'Save Bill'}
      </button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title={isEditMode ? 'Edit Bill' : 'Create Bill'} footer={footer}>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm"
          />
          <button
            type="button"
            onClick={onCreateNewItem}
            className="rounded-lg border border-dashed border-brand px-4 py-2 text-sm font-semibold text-brand"
          >
            + Create New Item
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {!visibleItems.length && (
            <p className="col-span-full text-sm text-slate-500">No items match that search.</p>
          )}
          {visibleItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => addItem(item)}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-left"
            >
              <div>
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-slate-500">Stock: {item.stock}</p>
              </div>
              <span className="text-sm font-semibold text-brand">{formatCurrency(item.price)}</span>
            </button>
          ))}
        </div>
        {filteredItems.length > 6 && (
          <p className="text-xs text-slate-500">
            Showing the first 6 items. Refine your search to find others.
          </p>
        )}

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">Bill items</p>
          <div className="mt-3 space-y-3">
            {!draftItems.length && <p className="text-sm text-slate-500">No items added yet.</p>}
            {draftItems.map((entry) => (
              <div key={entry.item.id} className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">{entry.item.name}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(entry.item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={entry.quantity}
                    onChange={(e) => updateQuantity(entry.item.id, Number(e.target.value))}
                    className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-center"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(entry.item.id)}
                    className="text-xs font-semibold text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          <div className="mt-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Final Total (editable)</label>
            <input
              type="number"
              value={finalTotalInput || ''}
              placeholder={subtotal.toFixed(2)}
              onChange={(e) => setFinalTotalInput(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </div>
          <div className="mt-4 flex items-center justify-between text-base font-semibold">
            <span>Total to collect</span>
            <span>{formatCurrency(finalTotal)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
