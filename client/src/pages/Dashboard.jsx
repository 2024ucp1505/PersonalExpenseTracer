import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];
const MONTHS  = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatCurrency(val) {
  return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

const STAT_CONFIG = [
  {
    icon: '💰', label: 'Total Balance', key: 'total_balance',
    gradient: 'from-indigo-600/30 to-indigo-800/20', border: 'border-indigo-500/20',
    valueColor: 'text-indigo-300', iconBg: 'bg-indigo-500/20',
  },
  {
    icon: '📈', label: 'Monthly Income', key: 'month_income',
    gradient: 'from-emerald-600/30 to-emerald-800/20', border: 'border-emerald-500/20',
    valueColor: 'text-emerald-300', iconBg: 'bg-emerald-500/20',
  },
  {
    icon: '📉', label: 'Monthly Expenses', key: 'month_expense',
    gradient: 'from-rose-600/30 to-rose-800/20', border: 'border-rose-500/20',
    valueColor: 'text-rose-300', iconBg: 'bg-rose-500/20',
  },
  {
    icon: '🏦', label: 'Net Savings', key: 'month_savings',
    gradient: 'from-amber-600/30 to-amber-800/20', border: 'border-amber-500/20',
    valueColor: 'text-amber-300', iconBg: 'bg-amber-500/20',
  },
];

const ACCOUNT_TYPE_ICONS = {
  checking: '🏧', savings: '🏦', credit_card: '💳', cash: '💵', investment: '📈',
};

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get().then((res) => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="spinner" />
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center min-h-screen text-slate-400">
      Failed to load dashboard.
    </div>
  );

  // Build bar chart data
  const trendMap = {};
  data.monthly_trend.forEach(({ year, month, type, total }) => {
    const key = `${MONTHS[month]} ${year}`;
    if (!trendMap[key]) trendMap[key] = { name: key, income: 0, expense: 0 };
    trendMap[key][type] = Number(total);
  });
  const barData = Object.values(trendMap);

  // Pie chart data
  const pieData = data.category_breakdown.map((c) => ({
    name: `${c.icon} ${c.name}`,
    value: Number(c.total),
  }));

  const tooltipStyle = {
    contentStyle: { background: '#0f0f23', border: '1px solid #252550', borderRadius: 10, fontSize: 12 },
    labelStyle: { color: '#e2e8f0' },
    itemStyle: { color: '#a5b4fc' },
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-slate-400 text-sm">Your financial overview at a glance</p>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {STAT_CONFIG.map(({ icon, label, key, gradient, border, valueColor, iconBg }, i) => (
          <div
            key={key}
            className={`glass bg-gradient-to-br ${gradient} border ${border} p-4 md:p-5 rounded-2xl animate-fade-in`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center text-lg mb-3`}>
              {icon}
            </div>
            <p className="text-slate-400 text-xs font-medium mb-1">{label}</p>
            <p className={`font-bold text-base md:text-lg ${valueColor} leading-tight`}>
              {formatCurrency(data[key])}
            </p>
          </div>
        ))}
      </div>

      {/* ── Charts ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        {/* Bar Chart */}
        <div className="glass p-4 md:p-6 rounded-2xl animate-fade-in" style={{ animationDelay: '240ms' }}>
          <h2 className="text-base font-semibold text-white mb-4">Income vs Expenses</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3f" vertical={false} />
              <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false}
                     tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip {...tooltipStyle} formatter={(v) => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Bar dataKey="income"  fill="#10b981" radius={[6, 6, 0, 0]} name="Income"  maxBarSize={32} />
              <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Expense" maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="glass p-4 md:p-6 rounded-2xl animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h2 className="text-base font-semibold text-white mb-4">Spending by Category</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[240px] text-slate-500 text-sm">
              No expenses this month yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%"
                  innerRadius={60} outerRadius={95}
                  paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => formatCurrency(val)} {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Accounts + Recent Transactions ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Accounts */}
        <div className="glass p-4 md:p-6 rounded-2xl animate-fade-in" style={{ animationDelay: '360ms' }}>
          <h2 className="text-base font-semibold text-white mb-4">Your Accounts</h2>
          {data.accounts.length === 0 ? (
            <p className="text-slate-500 text-sm">No accounts yet.</p>
          ) : (
            <div className="space-y-3">
              {data.accounts.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{ACCOUNT_TYPE_ICONS[a.type] || '🏦'}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{a.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{a.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm ${Number(a.balance) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(a.balance)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="glass p-4 md:p-6 rounded-2xl animate-fade-in" style={{ animationDelay: '420ms' }}>
          <h2 className="text-base font-semibold text-white mb-4">Recent Transactions</h2>
          {data.recent_transactions.length === 0 ? (
            <p className="text-slate-500 text-sm">No transactions yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recent_transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#16162e] flex items-center justify-center text-lg">
                      {t.category_icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{t.description || t.category_name}</p>
                      <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
