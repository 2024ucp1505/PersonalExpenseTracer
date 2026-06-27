import { useState, useEffect } from 'react';
import { transactionsAPI, accountsAPI, categoriesAPI } from '../services/api';

function formatCurrency(val) {
  return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

const inputClass = `w-full bg-[#16162e] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm
  placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all`;

const selectClass = `bg-[#16162e] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
  focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer`;

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts]         = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [filters, setFilters]           = useState({ type: '', category_id: '', account_id: '' });

  const [form, setForm] = useState({
    account_id: '', category_id: '', type: 'expense', amount: '', description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchAll = async () => {
    try {
      const [txnRes, accRes, catRes] = await Promise.all([
        transactionsAPI.getAll(filters),
        accountsAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setTransactions(txnRes.data);
      setAccounts(accRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await transactionsAPI.create(form);
      setShowForm(false);
      setForm({ account_id: '', category_id: '', type: 'expense', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add transaction');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await transactionsAPI.delete(id);
      fetchAll();
    } catch {
      alert('Failed to delete');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen"><div className="spinner" /></div>
  );

  const filteredCategories = categories.filter(c => !form.type || c.type === form.type);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Transactions</h1>
          <p className="text-slate-400 text-sm">{transactions.length} records found</p>
        </div>
        <button
          id="toggle-txn-form"
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            showForm
              ? 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
              : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 text-white shadow-lg shadow-indigo-900/40'
          }`}
        >
          {showForm ? '✕ Cancel' : '+ Add Transaction'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="glass rounded-2xl p-5 mb-5 animate-slide-up border border-indigo-500/15">
          <h2 className="text-base font-semibold text-white mb-4">New Transaction</h2>
          <form id="txn-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Type</label>
              <select value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value, category_id: '' })}
                      className={selectClass + ' w-full'}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Account</label>
              <select value={form.account_id}
                      onChange={(e) => setForm({ ...form, account_id: e.target.value })}
                      required className={selectClass + ' w-full'}>
                <option value="">Select account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
              <select value={form.category_id}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      required className={selectClass + ' w-full'}>
                <option value="">Select category</option>
                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Amount (₹)</label>
              <input type="number" step="0.01" min="0" value={form.amount}
                     onChange={(e) => setForm({ ...form, amount: e.target.value })}
                     placeholder="0.00" required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Date</label>
              <input type="date" value={form.date}
                     onChange={(e) => setForm({ ...form, date: e.target.value })}
                     required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
              <input type="text" value={form.description}
                     onChange={(e) => setForm({ ...form, description: e.target.value })}
                     placeholder="What was this for?" className={inputClass} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <button type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500
                                 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-900/40 transition-all active:scale-[0.98]">
                Save Transaction
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="glass rounded-2xl p-4 mb-5 animate-fade-in" style={{ animationDelay: '60ms' }}>
        <div className="flex flex-wrap gap-3">
          <select value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className={selectClass}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select value={filters.account_id}
                  onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}
                  className={selectClass}>
            <option value="">All Accounts</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={filters.category_id}
                  onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
                  className={selectClass}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="glass rounded-2xl overflow-hidden animate-fade-in" style={{ animationDelay: '120ms' }}>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <span className="text-4xl mb-3">📭</span>
            <p className="font-medium">No transactions found</p>
            <p className="text-sm">Add your first transaction above!</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    {['Date', 'Category', 'Description', 'Account', 'Amount', ''].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-5 py-4 text-sm text-slate-300 whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16162e] text-xs text-slate-300 border border-white/5">
                          {t.category_icon} {t.category_name}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-300">{t.description || '—'}</td>
                      <td className="px-5 py-4 text-sm text-slate-400">{t.account_name}</td>
                      <td className={`px-5 py-4 text-sm font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => handleDelete(t.id)}
                                className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center
                                           rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all text-xs">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-white/[0.04]">
              {transactions.map((t) => (
                <div key={t.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#16162e] flex items-center justify-center text-lg border border-white/5">
                      {t.category_icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{t.description || t.category_name}</p>
                      <p className="text-xs text-slate-500">{t.account_name} · {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                    <button onClick={() => handleDelete(t.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 text-xs">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
