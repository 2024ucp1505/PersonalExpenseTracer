import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import StatCard from '../components/StatCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatCurrency(val) {
  return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get().then((res) => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!data)   return <div className="page-container"><p>Failed to load dashboard.</p></div>;

  // Build bar chart data from monthly_trend
  const trendMap = {};
  data.monthly_trend.forEach(({ year, month, type, total }) => {
    const key = `${MONTHS[month]} ${year}`;
    if (!trendMap[key]) trendMap[key] = { name: key, income: 0, expense: 0 };
    trendMap[key][type] = Number(total);
  });
  const barData = Object.values(trendMap);

  // Pie data
  const pieData = data.category_breakdown.map((c) => ({
    name: `${c.icon} ${c.name}`,
    value: Number(c.total),
  }));

  return (
    <div className="page-container">
      <h1 className="page-title">Dashboard</h1>

      {/* ── Stat Cards ──────────────────────────────── */}
      <div className="stat-grid">
        <StatCard icon="💰" label="Total Balance"    value={formatCurrency(data.total_balance)}  className="card-balance" />
        <StatCard icon="📈" label="Monthly Income"   value={formatCurrency(data.month_income)}   className="card-income" />
        <StatCard icon="📉" label="Monthly Expenses" value={formatCurrency(data.month_expense)}  className="card-expense" />
        <StatCard icon="🏦" label="Net Savings"      value={formatCurrency(data.month_savings)}  className="card-savings" />
      </div>

      {/* ── Charts Row ──────────────────────────────── */}
      <div className="charts-grid">
        {/* Bar chart — income vs expense trend */}
        <div className="chart-card">
          <h2 className="chart-title">Income vs Expenses (6 Months)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3f" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#1e1e2e', border: '1px solid #3d3d5c', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Bar dataKey="income"  fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — spending breakdown */}
        <div className="chart-card">
          <h2 className="chart-title">Spending by Category</h2>
          {pieData.length === 0 ? (
            <p className="empty-text">No expenses this month yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => formatCurrency(val)}
                  contentStyle={{ background: '#1e1e2e', border: '1px solid #3d3d5c', borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Accounts + Recent Transactions Row ──────── */}
      <div className="bottom-grid">
        {/* Accounts */}
        <div className="card">
          <h2 className="card-header">Your Accounts</h2>
          <div className="account-list">
            {data.accounts.map((a) => (
              <div key={a.id} className="account-item">
                <div>
                  <span className="account-name">{a.name}</span>
                  <span className="account-type">{a.type}</span>
                </div>
                <span className={`account-balance ${Number(a.balance) >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(a.balance)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <h2 className="card-header">Recent Transactions</h2>
          <div className="txn-list">
            {data.recent_transactions.map((t) => (
              <div key={t.id} className="txn-item">
                <div className="txn-left">
                  <span className="txn-icon">{t.category_icon}</span>
                  <div>
                    <span className="txn-desc">{t.description || t.category_name}</span>
                    <span className="txn-date">{new Date(t.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`txn-amount ${t.type}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
