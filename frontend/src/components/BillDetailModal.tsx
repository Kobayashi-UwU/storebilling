import { format } from 'date-fns';
import type { Bill } from '../types';
import Modal from './Modal';
import { formatCurrency } from '../utils/number';

interface Props {
  bill: Bill | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (bill: Bill) => void;
  onDelete?: (bill: Bill) => void;
}

export default function BillDetailModal({ bill, open, onClose, onEdit, onDelete }: Props) {
  if (!bill) return null;

  const createdAtLabel = bill.created_at ? format(new Date(bill.created_at), 'PPpp') : 'N/A';
  const billDateLabel = bill.bill_date ? format(new Date(bill.bill_date), 'yyyy-MM-dd') : bill.bill_date;
  const footer = (
    <div className="flex w-full items-center justify-between">
      <button
        type="button"
        onClick={() => onDelete?.(bill)}
        className="text-sm font-semibold text-rose-600"
      >
        Delete Bill
      </button>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onEdit?.(bill)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
        >
          Edit Bill
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Bill #${bill.id.slice(0, 6)}`}
      footer={footer}
    >
      <div className="space-y-4 text-sm text-slate-700">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-slate-500">Bill date</p>
            <p className="text-base font-semibold text-slate-900">{billDateLabel}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Created at</p>
            <p className="text-base font-semibold text-slate-900">{createdAtLabel}</p>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase text-slate-500">Items</p>
          <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50">
            {bill.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-3">
                  {item.image_base64 ? (
                    <img src={item.image_base64} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-white" />
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.quantity} × {formatCurrency(item.price_per_unit)}
                    </p>
                  </div>
                </div>
                <p className="text-base font-semibold text-slate-900">{formatCurrency(item.total_price)}</p>
              </div>
            ))}
            {!bill.items?.length && <p className="px-4 py-3 text-sm text-slate-500">No line items recorded.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-semibold">{formatCurrency(bill.total_price)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Discount</span>
            <span className="font-semibold text-rose-600">{formatCurrency(bill.total_price - bill.final_price)}</span>
          </div>
          <div className="flex items-center justify-between text-lg font-bold text-slate-900">
            <span>Final total</span>
            <span>{formatCurrency(bill.final_price)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
