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

  const now   = new Date();
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
    } catch (err) {
      alert('Failed to delete');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0);
  const totalSpent  = budgets.reduce((s, b) => s + Number(b.spent), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Budgets</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Set Budget'}
        </button>
      </div>

      {/* ── Month Selector ──────────────────────────── */}
      <div className="card filter-bar">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2026, i).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="card form-card slide-down">
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Category</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
                <option value="">Select expense category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Budget Amount (₹)</label>
              <input type="number" step="0.01" min="0" value={form.amount}
                     onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div className="form-group form-actions">
              <button type="submit" className="btn btn-primary">Save Budget</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Summary ─────────────────────────────────── */}
      <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card card-balance">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-label">Total Budget</span>
            <span className="stat-value">{formatCurrency(totalBudget)}</span>
          </div>
        </div>
        <div className="stat-card card-expense">
          <div className="stat-icon">💸</div>
          <div className="stat-info">
            <span className="stat-label">Total Spent</span>
            <span className="stat-value">{formatCurrency(totalSpent)}</span>
          </div>
        </div>
        <div className={`stat-card ${totalSpent <= totalBudget ? 'card-income' : 'card-expense'}`}>
          <div className="stat-icon">{totalSpent <= totalBudget ? '✅' : '⚠️'}</div>
          <div className="stat-info">
            <span className="stat-label">Remaining</span>
            <span className="stat-value">{formatCurrency(totalBudget - totalSpent)}</span>
          </div>
        </div>
      </div>

      {/* ── Budget Cards ────────────────────────────── */}
      {budgets.length === 0 ? (
        <div className="card"><p className="empty-text">No budgets set for this month.</p></div>
      ) : (
        <div className="budget-grid">
          {budgets.map((b) => {
            const spent   = Number(b.spent);
            const budget  = Number(b.amount);
            const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
            const over    = spent > budget;

            return (
              <div key={b.id} className="card budget-card">
                <div className="budget-card-header">
                  <span>{b.category_icon} {b.category_name}</span>
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(b.id)}>🗑️</button>
                </div>
                <div className="budget-amounts">
                  <span className={over ? 'text-red' : 'text-green'}>{formatCurrency(spent)}</span>
                  <span className="text-muted">/ {formatCurrency(budget)}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${over ? 'over' : ''}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="budget-percent">{percent.toFixed(0)}% used</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
