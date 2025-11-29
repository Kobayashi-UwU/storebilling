interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function DateSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Billing Date</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none"
      />
    </div>
  );
}
