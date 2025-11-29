import type { Item } from '../types';
import { formatCurrency } from '../utils/number';

interface Props {
  item: Item;
  onClick: (item: Item) => void;
}

export default function ItemCard({ item, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className="flex flex-col rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {item.image_base64 ? (
        <img src={item.image_base64} alt={item.name} className="h-36 w-full rounded-xl object-cover" />
      ) : (
        <div className="flex h-36 w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400">No image</div>
      )}
      <div className="mt-3">
        <p className="text-sm font-semibold text-slate-800">{item.name}</p>
        <p className="text-xs text-slate-500">Stock: {item.stock}</p>
        <p className="text-base font-bold text-brand">{formatCurrency(item.price)}</p>
      </div>
    </button>
  );
}
