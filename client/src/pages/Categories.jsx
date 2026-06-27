import { useState, useEffect } from 'react';
import { categoriesAPI } from '../services/api';

const EMOJIS = ['📁', '💰', '💻', '🍔', '🚗', '🎬', '🛍️', '💡', '🏠', '🏥', '📈', '🎵', '✈️', '📚', '🎮', '💪', '🐾', '☕'];

function CategoryCard({ cat, onEdit, onDelete }) {
  const isIncome = cat.type === 'income';
  return (
    <div className={`glass rounded-2xl p-4 border transition-all hover:scale-[1.02] group ${
      isIncome ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-600/10 to-emerald-800/5'
               : 'border-rose-500/20 bg-gradient-to-br from-rose-600/10 to-rose-800/5'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{cat.icon}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(cat)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-sm">
            ✏️
          </button>
          <button onClick={() => onDelete(cat.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all text-sm">
            🗑️
          </button>
        </div>
      </div>
      <p className="text-sm font-medium text-white truncate">{cat.name}</p>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
        isIncome ? 'text-emerald-400 bg-emerald-500/15' : 'text-rose-400 bg-rose-500/15'
      }`}>
        {cat.type}
      </span>
    </div>
  );
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState({ name: '', type: 'expense', icon: '📁' });

  const fetchCategories = async () => {
    try {
      const res = await categoriesAPI.getAll();
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const resetForm = () => {
    setForm({ name: '', type: 'expense', icon: '📁' });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await categoriesAPI.update(editId, form);
      } else {
        await categoriesAPI.create(form);
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleEdit = (cat) => {
    setForm({ name: cat.name, type: cat.type, icon: cat.icon });
    setEditId(cat.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? Transactions using it will also be deleted.')) return;
    try {
      await categoriesAPI.delete(id);
      fetchCategories();
    } catch {
      alert('Failed to delete');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen"><div className="spinner" /></div>
  );

  const incomeCategories  = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Categories</h1>
          <p className="text-slate-400 text-sm">{categories.length} categories total</p>
        </div>
        <button
          id="toggle-cat-form"
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            showForm
              ? 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
              : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 text-white shadow-lg shadow-indigo-900/40'
          }`}
        >
          {showForm ? '✕ Cancel' : '+ Add Category'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass rounded-2xl p-5 mb-6 animate-slide-up border border-indigo-500/15">
          <h2 className="text-base font-semibold text-white mb-4">{editId ? 'Edit Category' : 'New Category'}</h2>
          <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Category Name</label>
                <input type="text" value={form.name}
                       onChange={(e) => setForm({ ...form, name: e.target.value })}
                       placeholder="e.g. Groceries" required
                       className="w-full bg-[#16162e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className="w-full bg-[#16162e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer">
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Choose Icon</label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setForm({ ...form, icon: e })}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-xl transition-all ${
                      form.icon === e
                        ? 'bg-indigo-600/40 border-2 border-indigo-500 scale-110'
                        : 'bg-[#16162e] border border-white/10 hover:bg-white/10 hover:scale-105'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500
                                 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-900/40 transition-all active:scale-[0.98]">
                {editId ? 'Update' : 'Create'} Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Income Categories */}
      <div className="mb-7 animate-fade-in" style={{ animationDelay: '120ms' }}>
        <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>💰</span> Income Categories
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium">
            {incomeCategories.length}
          </span>
        </h2>
        {incomeCategories.length === 0 ? (
          <p className="text-slate-500 text-sm">No income categories yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {incomeCategories.map((c, i) => (
              <CategoryCard key={c.id} cat={c} onEdit={handleEdit} onDelete={handleDelete}
                            style={{ animationDelay: `${i * 40}ms` }} />
            ))}
          </div>
        )}
      </div>

      {/* Expense Categories */}
      <div className="animate-fade-in" style={{ animationDelay: '180ms' }}>
        <h2 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>💸</span> Expense Categories
          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 text-xs font-medium">
            {expenseCategories.length}
          </span>
        </h2>
        {expenseCategories.length === 0 ? (
          <p className="text-slate-500 text-sm">No expense categories yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {expenseCategories.map((c, i) => (
              <CategoryCard key={c.id} cat={c} onEdit={handleEdit} onDelete={handleDelete}
                            style={{ animationDelay: `${i * 40}ms` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
