import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import DateSelector from '../components/DateSelector';
import BillCard from '../components/BillCard';
import CreateBillModal from '../components/CreateBillModal';
import CreateItemModal from '../components/CreateItemModal';
import BillDetailModal from '../components/BillDetailModal';
import { useItems } from '../hooks/useItems';
import { useBills } from '../hooks/useBills';
import { formatCurrency } from '../utils/number';
import type { Bill } from '../types';

const today = format(new Date(), 'yyyy-MM-dd');

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(today);
  const [billFormOpen, setBillFormOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  const { items, addItem } = useItems();
  const { bills, loading, totalRevenue, addBill, editBill, removeBill } = useBills(selectedDate);

  const dateLabel = useMemo(() => format(new Date(selectedDate), 'MMMM d, yyyy'), [selectedDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
          <DateSelector value={selectedDate} onChange={setSelectedDate} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Currently viewing</p>
            <p className="text-2xl font-semibold text-slate-900">{dateLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingBill(null);
            setBillFormOpen(true);
          }}
          className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/30"
        >
          + Create Bill
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {loading && <p className="text-sm text-slate-500">Loading bills…</p>}
        {!loading && !bills.length && <p className="text-sm text-slate-500">No bills for this day yet.</p>}
        {bills.map((bill) => (
          <BillCard key={bill.id} bill={bill} onSelect={setSelectedBill} />
        ))}
      </section>

      <div className="rounded-3xl border border-slate-100 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Daily revenue</p>
        <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
      </div>

      <CreateBillModal
        open={billFormOpen}
        onClose={() => {
          setBillFormOpen(false);
          setEditingBill(null);
        }}
        items={items}
        billDate={editingBill ? editingBill.bill_date : selectedDate}
        onCreate={addBill}
        onCreateNewItem={() => setItemModalOpen(true)}
        mode={editingBill ? 'edit' : 'create'}
        initialBill={editingBill}
        onUpdate={editBill}
      />

      <CreateItemModal
        open={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        onSubmit={addItem}
      />

      <BillDetailModal
        bill={selectedBill}
        open={Boolean(selectedBill)}
        onClose={() => setSelectedBill(null)}
        onEdit={(bill) => {
          setSelectedBill(null);
          setEditingBill(bill);
          setBillFormOpen(true);
        }}
        onDelete={async (bill) => {
          if (!window.confirm('Delete this bill? This action cannot be undone.')) {
            return;
          }
          await removeBill(bill.id);
          setSelectedBill(null);
        }}
      />
    </div>
  );
}
