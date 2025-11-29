import { useEffect, useMemo, useState } from 'react';
import { addDays, eachDayOfInterval, format, parseISO, subDays } from 'date-fns';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { fetchBillsInRange } from '../lib/api';
import type { Bill } from '../types';
import { formatCurrency } from '../utils/number';

const formatIso = (date: Date) => format(date, 'yyyy-MM-dd');
const PRESET_RANGES = [
  { label: 'Today', days: 1 },
  { label: 'Last 3 days', days: 3 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 6 months', days: 182 },
  { label: 'Last 1 year', days: 365 }
];

export default function DashboardPage() {
  const today = new Date();
  const [startDate, setStartDate] = useState(formatIso(subDays(today, 6)));
  const [endDate, setEndDate] = useState(formatIso(today));
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateRangeError = useMemo(() => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 'Please pick valid dates';
    }
    if (start > end) {
      return 'Start date must be before end date';
    }
    if (eachDayOfInterval({ start, end }).length > 60) {
      return 'Please limit the range to 60 days for performance';
    }
    return null;
  }, [startDate, endDate]);

  useEffect(() => {
    if (dateRangeError) {
      setBills([]);
      setError(null);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchBillsInRange(startDate, endDate);
        if (!cancelled) {
          setBills(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, dateRangeError]);

  const summary = useMemo(() => {
    const totalRevenue = bills.reduce((sum, bill) => sum + bill.final_price, 0);
    const totalBills = bills.length;
    const avgOrder = totalBills ? totalRevenue / totalBills : 0;
    return { totalRevenue, totalBills, avgOrder };
  }, [bills]);

  const chartData = useMemo(() => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return [];
    }
    const days = eachDayOfInterval({ start, end });
    return days.map((day) => {
      const iso = formatIso(day);
      const dayBills = bills.filter((bill) => bill.bill_date?.slice(0, 10) === iso);
      const revenue = dayBills.reduce((sum, bill) => sum + bill.final_price, 0);
      return {
        date: format(day, 'MMM dd'),
        revenue,
        orders: dayBills.length
      };
    });
  }, [bills, startDate, endDate]);

  const nextRange = () => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return;
    }
    const dayCount = Math.max(1, eachDayOfInterval({ start, end }).length);
    setStartDate(formatIso(addDays(start, dayCount)));
    setEndDate(formatIso(addDays(end, dayCount)));
  };

  const applyPreset = (days: number) => {
    const today = new Date();
    const newEnd = formatIso(today);
    const newStart = formatIso(subDays(today, days - 1));
    setEndDate(newEnd);
    setStartDate(newStart);
  };

  const isPresetActive = (days: number) => {
    const today = formatIso(new Date());
    const targetStart = formatIso(subDays(new Date(), days - 1));
    return endDate === today && startDate === targetStart;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">Overview</p>
            <h1 className="text-2xl font-semibold text-slate-900">Revenue Dashboard</h1>
            <p className="text-sm text-slate-500">Visualize performance across any custom date range.</p>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quick ranges</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {PRESET_RANGES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset.days)}
                    className={`rounded-xl border px-3 py-2 text-sm text-left transition ${
                      isPresetActive(preset.days)
                        ? 'border-brand bg-brand text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-brand hover:bg-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-wrap gap-3 lg:justify-end">
            <div className="flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start Date</label>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm"
              />
            </div>
          </div>
        </div>
        {dateRangeError && <p className="mt-3 text-sm font-medium text-rose-600">{dateRangeError}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total revenue" value={formatCurrency(summary.totalRevenue)} />
        <SummaryCard label="Bills" value={summary.totalBills.toString()} />
        <SummaryCard label="Avg. order" value={formatCurrency(summary.avgOrder)} />
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Revenue timeline</h2>
          <button
            type="button"
            onClick={nextRange}
            className="text-sm font-semibold text-brand disabled:opacity-50"
            disabled={chartData.length === 0}
          >
            Jump Forward
          </button>
        </div>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={(value) => (typeof value === 'number' ? formatCurrency(value) : value)} />
              <Tooltip
                formatter={(value) => (typeof value === 'number' ? formatCurrency(value) : value)}
                labelStyle={{ color: '#0f172a' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#revenueFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Orders per day</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="orders" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading dashboard…</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
