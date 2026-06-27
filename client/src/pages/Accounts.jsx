import { useState, useEffect } from 'react';
import { accountsAPI } from '../services/api';

function formatCurrency(val) {
  return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

const ACCOUNT_TYPES = ['checking', 'savings', 'credit_card', 'cash', 'investment'];

const TYPE_META = {
  checking:    { icon: '🏧', gradient: 'from-indigo-600/20 to-indigo-800/10', border: 'border-indigo-500/20', badge: 'bg-indigo-500/15 text-indigo-300' },
  savings:     { icon: '🏦', gradient: 'from-emerald-600/20 to-emerald-800/10', border: 'border-emerald-500/20', badge: 'bg-emerald-500/15 text-emerald-300' },
  credit_card: { icon: '💳', gradient: 'from-rose-600/20 to-rose-800/10', border: 'border-rose-500/20', badge: 'bg-rose-500/15 text-rose-300' },
  cash:        { icon: '💵', gradient: 'from-amber-600/20 to-amber-800/10', border: 'border-amber-500/20', badge: 'bg-amber-500/15 text-amber-300' },
  investment:  { icon: '📈', gradient: 'from-purple-600/20 to-purple-800/10', border: 'border-purple-500/20', badge: 'bg-purple-500/15 text-purple-300' },
};

const inputClass = `w-full bg-[#16162e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm
  placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all`;

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState({ name: '', type: 'checking', balance: '' });

  const fetchAccounts = async () => {
    try {
      const res = await accountsAPI.getAll();
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const resetForm = () => {
    setForm({ name: '', type: 'checking', balance: '' });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await accountsAPI.update(editId, form);
      } else {
        await accountsAPI.create(form);
      }
      resetForm();
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleEdit = (acc) => {
    setForm({ name: acc.name, type: acc.type, balance: acc.balance });
    setEditId(acc.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this account and all its transactions?')) return;
    try {
      await accountsAPI.delete(id);
      fetchAccounts();
    } catch {
      alert('Failed to delete');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen"><div className="spinner" /></div>
  );

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Accounts</h1>
          <p className="text-slate-400 text-sm">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          id="toggle-acc-form"
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            showForm
              ? 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
              : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 text-white shadow-lg shadow-indigo-900/40'
          }`}
        >
          {showForm ? '✕ Cancel' : '+ Add Account'}
        </button>
      </div>

      {/* Net Worth Banner */}
      <div className="glass bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20
                      rounded-2xl p-5 mb-6 flex items-center gap-4 animate-fade-in" style={{ animationDelay: '60ms' }}>
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-2xl">🏦</div>
        <div>
          <p className="text-sm text-slate-400 font-medium">Total Net Worth</p>
          <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(totalBalance)}
          </p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass rounded-2xl p-5 mb-6 animate-slide-up border border-indigo-500/15">
          <h2 className="text-base font-semibold text-white mb-4">{editId ? 'Edit Account' : 'New Account'}</h2>
          <form id="account-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Account Name</label>
              <input type="text" value={form.name}
                     onChange={(e) => setForm({ ...form, name: e.target.value })}
                     placeholder="e.g. Main Checking" required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full bg-[#16162e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer">
                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Balance (₹)</label>
              <input type="number" step="0.01" value={form.balance}
                     onChange={(e) => setForm({ ...form, balance: e.target.value })}
                     placeholder="0.00" required className={inputClass} />
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <button type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500
                                 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-900/40 transition-all active:scale-[0.98]">
                {editId ? 'Update Account' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Account Cards */}
      {accounts.length === 0 ? (
        <div className="glass rounded-2xl flex flex-col items-center justify-center py-16 text-slate-500">
          <span className="text-4xl mb-3">🏦</span>
          <p className="font-medium">No accounts yet</p>
          <p className="text-sm">Add your first account above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc, i) => {
            const meta = TYPE_META[acc.type] || TYPE_META.checking;
            return (
              <div
                key={acc.id}
                className={`glass bg-gradient-to-br ${meta.gradient} border ${meta.border} rounded-2xl p-5 animate-fade-in`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${meta.badge}`}>
                    {acc.type.replace('_', ' ')}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(acc)} title="Edit"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-sm">
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(acc.id)} title="Delete"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all text-sm">
                      🗑️
                    </button>
                  </div>
                </div>
                <p className="text-3xl mb-2">{meta.icon}</p>
                <p className="text-base font-semibold text-white mb-1">{acc.name}</p>
                <p className={`text-xl font-bold ${Number(acc.balance) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(acc.balance)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
