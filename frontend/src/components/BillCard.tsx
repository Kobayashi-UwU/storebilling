import type { Bill } from '../types';
import { formatCurrency } from '../utils/number';

interface Props {
  bill: Bill;
  onSelect?: (bill: Bill) => void;
}

export default function BillCard({ bill, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(bill)}
      className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Bill #{bill.id.slice(0, 6)}</p>
          <p className="text-lg font-semibold">{formatCurrency(bill.final_price)}</p>
        </div>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Paid</span>
      </div>
      <div className="mt-4 space-y-2">
        {bill.items?.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm text-slate-600">
            <div className="flex items-center gap-2">
              {item.image_base64 ? (
                <img src={item.image_base64} alt={item.name} className="h-8 w-8 rounded object-cover" />
              ) : (
                <div className="h-8 w-8 rounded bg-slate-100" />
              )}
              <div>
                <p className="font-medium text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-500">
                  {item.quantity} × {formatCurrency(item.price_per_unit)}
                </p>
              </div>
            </div>
            <p className="font-semibold">{formatCurrency(item.total_price)}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
        <p className="text-slate-500">Original total</p>
        <p className="font-semibold text-slate-700">{formatCurrency(bill.total_price)}</p>
      </div>
      {bill.final_price !== bill.total_price && (
        <div className="flex items-center justify-between text-sm text-brand">
          <p>Discount applied</p>
          <p>-{formatCurrency(bill.total_price - bill.final_price)}</p>
        </div>
      )}
    </button>
  );
}
