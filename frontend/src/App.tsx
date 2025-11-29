import { NavLink, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ItemsPage from './pages/ItemsPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Store Billing</p>
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
          <nav className="flex gap-4 text-sm font-medium">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition ${isActive ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition ${isActive ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100'}`
              }
              end
            >
              Bills
            </NavLink>
            <NavLink
              to="/items"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition ${isActive ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              Items
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/items" element={<ItemsPage />} />
        </Routes>
      </main>
    </div>
  );
}
