import { useState, useEffect } from 'react';
import { categoriesAPI } from '../services/api';

const EMOJIS = ['📁', '💰', '💻', '🍔', '🚗', '🎬', '🛍️', '💡', '🏠', '🏥', '📈', '🎵', '✈️', '📚', '🎮', '💪', '🐾', '☕'];

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
    } catch (err) {
      alert('Failed to delete');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const incomeCategories  = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Categories</h1>
        <button className="btn btn-primary" onClick={() => { showForm ? resetForm() : setShowForm(true); }}>
          {showForm ? 'Cancel' : '+ Add Category'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card slide-down">
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Category Name</label>
              <input type="text" value={form.name}
                     onChange={(e) => setForm({ ...form, name: e.target.value })}
                     placeholder="e.g. Groceries" required />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="form-group">
              <label>Icon</label>
              <div className="emoji-grid">
                {EMOJIS.map(e => (
                  <button key={e} type="button"
                    className={`emoji-btn ${form.icon === e ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, icon: e })}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group form-actions">
              <button type="submit" className="btn btn-primary">
                {editId ? 'Update' : 'Create'} Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Income Categories ───────────────────────── */}
      <h2 className="section-title">💰 Income Categories</h2>
      <div className="category-grid">
        {incomeCategories.map(c => (
          <div key={c.id} className="card category-card income">
            <span className="category-icon">{c.icon}</span>
            <span className="category-name">{c.name}</span>
            <div className="category-actions">
              <button className="btn-icon" onClick={() => handleEdit(c)} title="Edit">✏️</button>
              <button className="btn-icon btn-danger" onClick={() => handleDelete(c.id)} title="Delete">🗑️</button>
            </div>
          </div>
        ))}
        {incomeCategories.length === 0 && <p className="empty-text">No income categories yet.</p>}
      </div>

      {/* ── Expense Categories ──────────────────────── */}
      <h2 className="section-title">💸 Expense Categories</h2>
      <div className="category-grid">
        {expenseCategories.map(c => (
          <div key={c.id} className="card category-card expense">
            <span className="category-icon">{c.icon}</span>
            <span className="category-name">{c.name}</span>
            <div className="category-actions">
              <button className="btn-icon" onClick={() => handleEdit(c)} title="Edit">✏️</button>
              <button className="btn-icon btn-danger" onClick={() => handleDelete(c.id)} title="Delete">🗑️</button>
            </div>
          </div>
        ))}
        {expenseCategories.length === 0 && <p className="empty-text">No expense categories yet.</p>}
      </div>
    </div>
  );
}
