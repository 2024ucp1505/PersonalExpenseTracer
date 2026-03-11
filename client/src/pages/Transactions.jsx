import { useState, useEffect } from 'react';
import { transactionsAPI, accountsAPI, categoriesAPI } from '../services/api';

function formatCurrency(val) {
  return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts]         = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [filters, setFilters]           = useState({ type: '', category_id: '', account_id: '' });

  // Form state
  const [form, setForm] = useState({
    account_id: '', category_id: '', type: 'expense', amount: '', description: '', date: new Date().toISOString().split('T')[0],
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
    } catch (err) {
      alert('Failed to delete');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const filteredCategories = categories.filter(c => !form.type || c.type === form.type);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Transaction'}
        </button>
      </div>

      {/* ── Add Transaction Form ────────────────────── */}
      {showForm && (
        <div className="card form-card slide-down">
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category_id: '' })}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="form-group">
              <label>Account</label>
              <select value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })} required>
                <option value="">Select account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
                <option value="">Select category</option>
                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" step="0.01" min="0" value={form.amount}
                     onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.date}
                     onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input type="text" value={form.description}
                     onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What was this for?" />
            </div>
            <div className="form-group form-actions">
              <button type="submit" className="btn btn-primary">Save Transaction</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filters ─────────────────────────────────── */}
      <div className="card filter-bar">
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={filters.account_id} onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}>
          <option value="">All Accounts</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={filters.category_id} onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      {/* ── Transactions Table ──────────────────────── */}
      <div className="card">
        {transactions.length === 0 ? (
          <p className="empty-text">No transactions found. Add your first one!</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Account</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.date).toLocaleDateString()}</td>
                    <td><span className="cat-badge">{t.category_icon} {t.category_name}</span></td>
                    <td>{t.description || '—'}</td>
                    <td>{t.account_name}</td>
                    <td className={t.type === 'income' ? 'text-green' : 'text-red'}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td>
                      <button className="btn-icon btn-danger" onClick={() => handleDelete(t.id)} title="Delete">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
