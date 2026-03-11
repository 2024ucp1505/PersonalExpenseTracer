const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// ── Dashboard Analytics ─────────────────────────────────
// Multiple aggregate queries — SUM, GROUP BY, JOINs
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const month  = req.query.month || new Date().getMonth() + 1;
    const year   = req.query.year  || new Date().getFullYear();

    // 1. Total balance across all accounts
    const [[{ total_balance }]] = await pool.query(
      'SELECT COALESCE(SUM(balance), 0) AS total_balance FROM accounts WHERE user_id = ?',
      [userId]
    );

    // 2. Income & Expense for the selected month
    const [monthSummary] = await pool.query(
      `SELECT type, SUM(amount) AS total
         FROM transactions
        WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
        GROUP BY type`,
      [userId, month, year]
    );

    const monthIncome  = monthSummary.find(r => r.type === 'income')?.total  || 0;
    const monthExpense = monthSummary.find(r => r.type === 'expense')?.total || 0;

    // 3. Spending by category (current month) — for pie chart
    const [categoryBreakdown] = await pool.query(
      `SELECT c.name, c.icon, SUM(t.amount) AS total
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ? AND t.type = 'expense'
          AND MONTH(t.date) = ? AND YEAR(t.date) = ?
        GROUP BY c.id, c.name, c.icon
        ORDER BY total DESC`,
      [userId, month, year]
    );

    // 4. Monthly trend (last 6 months) — for bar chart
    const [monthlyTrend] = await pool.query(
      `SELECT YEAR(date)  AS year,
              MONTH(date) AS month,
              type,
              SUM(amount) AS total
         FROM transactions
        WHERE user_id = ?
          AND date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY YEAR(date), MONTH(date), type
        ORDER BY year, month`,
      [userId]
    );

    // 5. Recent transactions (last 5)
    const [recentTransactions] = await pool.query(
      `SELECT t.*, a.name AS account_name, c.name AS category_name, c.icon AS category_icon
         FROM transactions t
         JOIN accounts a   ON t.account_id  = a.id
         JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ?
        ORDER BY t.date DESC, t.id DESC
        LIMIT 5`,
      [userId]
    );

    // 6. Account balances
    const [accounts] = await pool.query(
      'SELECT id, name, type, balance FROM accounts WHERE user_id = ? ORDER BY balance DESC',
      [userId]
    );

    res.json({
      total_balance:       Number(total_balance),
      month_income:        Number(monthIncome),
      month_expense:       Number(monthExpense),
      month_savings:       Number(monthIncome) - Number(monthExpense),
      category_breakdown:  categoryBreakdown,
      monthly_trend:       monthlyTrend,
      recent_transactions: recentTransactions,
      accounts,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
