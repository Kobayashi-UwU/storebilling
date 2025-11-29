import { FormEvent, useEffect, useState } from 'react';
import Modal from './Modal';
import { fileToBase64 } from '../utils/image';
import type { Item } from '../types';

interface Props {
  item: Item | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, payload: Partial<Item> & { imageBase64?: string | null }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function EditItemModal({ item, open, onClose, onUpdate, onDelete }: Props) {
  const [form, setForm] = useState({ name: '', price: '0', stock: '0' });
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({ name: item.name, price: String(item.price), stock: String(item.stock) });
      setImage(item.image_base64 ?? null);
    }
  }, [item]);

  const handleImageChange = async (file?: File) => {
    if (!file) return;
    const base64 = await fileToBase64(file);
    setImage(base64);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!item) return;
    setLoading(true);
    try {
      await onUpdate(item.id, {
        name: form.name,
        price: Number(form.price),
        stock: Number(form.stock),
        imageBase64: image ?? undefined
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    setLoading(true);
    try {
      await onDelete(item.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex w-full items-center justify-between">
      <button
        type="button"
        className="text-sm font-semibold text-rose-600"
        onClick={handleDelete}
        disabled={loading}
      >
        Delete Item
      </button>
      <div className="flex gap-2">
        <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-sm" onClick={onClose}>
          Cancel
        </button>
        <button
          type="submit"
          form="edit-item-form"
          disabled={loading}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Update Item'}
        </button>
      </div>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Edit Item" footer={footer}>
      <form id="edit-item-form" className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-semibold text-slate-600">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-600">Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600">Stock</label>
            <input
              type="number"
              min="0"
              required
              value={form.stock}
              onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-600">Image</label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleImageChange(e.target.files?.[0])}
            className="mt-1 block w-full text-sm text-slate-600"
          />
          {image && <img src={image} alt="Preview" className="mt-2 h-32 rounded-lg object-cover" />}
        </div>
      </form>
    </Modal>
  );
}
