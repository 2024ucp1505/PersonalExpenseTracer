import { useState, useEffect } from 'react';
import { accountsAPI } from '../services/api';

function formatCurrency(val) {
  return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

const ACCOUNT_TYPES = ['checking', 'savings', 'credit_card', 'cash', 'investment'];

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
    } catch (err) {
      alert('Failed to delete');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Accounts</h1>
        <button className="btn btn-primary" onClick={() => { showForm ? resetForm() : setShowForm(true); }}>
          {showForm ? 'Cancel' : '+ Add Account'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card slide-down">
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Account Name</label>
              <input type="text" value={form.name}
                     onChange={(e) => setForm({ ...form, name: e.target.value })}
                     placeholder="e.g. Main Checking" required />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Balance (₹)</label>
              <input type="number" step="0.01" value={form.balance}
                     onChange={(e) => setForm({ ...form, balance: e.target.value })}
                     placeholder="0.00" required />
            </div>
            <div className="form-group form-actions">
              <button type="submit" className="btn btn-primary">
                {editId ? 'Update Account' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card card-balance" style={{ gridColumn: 'span 2' }}>
          <div className="stat-icon">🏦</div>
          <div className="stat-info">
            <span className="stat-label">Total Net Worth</span>
            <span className="stat-value">{formatCurrency(totalBalance)}</span>
          </div>
        </div>
      </div>

      <div className="accounts-grid">
        {accounts.map((acc) => (
          <div key={acc.id} className="card account-card">
            <div className="account-card-header">
              <span className="account-type-badge">{acc.type.replace('_', ' ')}</span>
              <div className="account-card-actions">
                <button className="btn-icon" onClick={() => handleEdit(acc)} title="Edit">✏️</button>
                <button className="btn-icon btn-danger" onClick={() => handleDelete(acc.id)} title="Delete">🗑️</button>
              </div>
            </div>
            <h3 className="account-card-name">{acc.name}</h3>
            <p className={`account-card-balance ${Number(acc.balance) >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(acc.balance)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
