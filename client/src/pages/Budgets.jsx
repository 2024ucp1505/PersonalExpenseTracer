import { useState, useEffect } from 'react';
import { budgetsAPI, categoriesAPI } from '../services/api';

function formatCurrency(val) {
  return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

export default function Budgets() {
  const [budgets, setBudgets]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  const [form, setForm] = useState({ category_id: '', amount: '' });

  const fetchData = async () => {
    try {
      const [budRes, catRes] = await Promise.all([
        budgetsAPI.getAll({ month, year }),
        categoriesAPI.getAll(),
      ]);
      setBudgets(budRes.data);
      setCategories(catRes.data.filter(c => c.type === 'expense'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [month, year]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await budgetsAPI.create({ ...form, month, year });
      setShowForm(false);
      setForm({ category_id: '', amount: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this budget?')) return;
    try {
      await budgetsAPI.delete(id);
      fetchData();
    } catch {
      alert('Failed to delete');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen"><div className="spinner" /></div>
  );

  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0);
  const totalSpent  = budgets.reduce((s, b) => s + Number(b.spent), 0);
  const remaining   = totalBudget - totalSpent;
  const overBudget  = totalSpent > totalBudget;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Budgets</h1>
          <p className="text-slate-400 text-sm">Track your spending limits</p>
        </div>
        <button
          id="toggle-budget-form"
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            showForm
              ? 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
              : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 text-white shadow-lg shadow-indigo-900/40'
          }`}
        >
          {showForm ? '✕ Cancel' : '+ Set Budget'}
        </button>
      </div>

      {/* Month Selector */}
      <div className="glass rounded-2xl p-4 mb-5 flex flex-wrap gap-3 items-center animate-fade-in" style={{ animationDelay: '60ms' }}>
        <span className="text-sm text-slate-400 font-medium">Viewing:</span>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-[#16162e] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2026, i).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
                className="bg-[#16162e] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer">
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5 animate-fade-in" style={{ animationDelay: '120ms' }}>
        {[
          { label: 'Total Budget', value: totalBudget, icon: '📋', color: 'text-indigo-300', bg: 'from-indigo-600/20 to-indigo-800/10', border: 'border-indigo-500/20' },
          { label: 'Total Spent',  value: totalSpent,  icon: '💸', color: 'text-rose-300',   bg: 'from-rose-600/20 to-rose-800/10',   border: 'border-rose-500/20' },
          { label: 'Remaining',   value: remaining,    icon: overBudget ? '⚠️' : '✅', color: overBudget ? 'text-rose-300' : 'text-emerald-300', bg: overBudget ? 'from-rose-600/20 to-rose-800/10' : 'from-emerald-600/20 to-emerald-800/10', border: overBudget ? 'border-rose-500/20' : 'border-emerald-500/20' },
        ].map(({ label, value, icon, color, bg, border }) => (
          <div key={label} className={`glass bg-gradient-to-br ${bg} border ${border} p-4 rounded-2xl`}>
            <p className="text-xs text-slate-400 mb-1 font-medium">{label}</p>
            <p className="text-lg md:text-xl font-bold">{icon}</p>
            <p className={`text-sm md:text-base font-bold ${color} mt-1`}>{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass rounded-2xl p-5 mb-5 animate-slide-up border border-indigo-500/15">
          <h2 className="text-base font-semibold text-white mb-4">Set Budget</h2>
          <form id="budget-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
              <select value={form.category_id}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      required
                      className="w-full bg-[#16162e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer">
                <option value="">Select expense category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Budget Amount (₹)</label>
              <input type="number" step="0.01" min="0" value={form.amount}
                     onChange={(e) => setForm({ ...form, amount: e.target.value })}
                     required
                     className="w-full bg-[#16162e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
            </div>
            <div className="flex items-end">
              <button type="submit"
                      className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500
                                 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-900/40 transition-all active:scale-[0.98]">
                Save Budget
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget Cards */}
      {budgets.length === 0 ? (
        <div className="glass rounded-2xl flex flex-col items-center justify-center py-16 text-slate-500">
          <span className="text-4xl mb-3">📋</span>
          <p className="font-medium">No budgets set for this month</p>
          <p className="text-sm">Click "+ Set Budget" to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b, i) => {
            const spent   = Number(b.spent);
            const budget  = Number(b.amount);
            const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
            const over    = spent > budget;

            return (
              <div
                key={b.id}
                className="glass rounded-2xl p-5 animate-fade-in border border-white/5"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-medium text-white">
                    {b.category_icon} {b.category_name}
                  </span>
                  <button onClick={() => handleDelete(b.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all text-sm">
                    🗑️
                  </button>
                </div>

                <div className="flex items-baseline justify-between mb-3">
                  <span className={`text-lg font-bold ${over ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatCurrency(spent)}
                  </span>
                  <span className="text-sm text-slate-500">/ {formatCurrency(budget)}</span>
                </div>

                <div className="progress-bar mb-2">
                  <div className={`progress-fill ${over ? 'over' : ''}`} style={{ width: `${percent}%` }} />
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${over ? 'text-rose-400' : 'text-slate-400'}`}>
                    {percent.toFixed(0)}% used
                  </span>
                  {over && (
                    <span className="text-xs text-rose-400 font-medium">
                      ⚠️ Over by {formatCurrency(spent - budget)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
