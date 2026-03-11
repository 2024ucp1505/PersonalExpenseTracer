const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// ── GET budgets for a given month/year with actual spending ──
//    JOIN + sub-query + GROUP BY  — great for interviews!
router.get('/', async (req, res) => {
  try {
    const month = req.query.month || new Date().getMonth() + 1;
    const year  = req.query.year  || new Date().getFullYear();

    const [rows] = await pool.query(
      `SELECT b.*,
              c.name AS category_name,
              c.icon AS category_icon,
              COALESCE(spent.total, 0) AS spent
         FROM budgets b
         JOIN categories c ON b.category_id = c.id
         LEFT JOIN (
           SELECT category_id, SUM(amount) AS total
             FROM transactions
            WHERE user_id = ?
              AND type = 'expense'
              AND MONTH(date) = ?
              AND YEAR(date)  = ?
            GROUP BY category_id
         ) spent ON spent.category_id = b.category_id
        WHERE b.user_id = ?
          AND b.month   = ?
          AND b.year    = ?
        ORDER BY c.name`,
      [req.user.id, month, year, req.user.id, month, year]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get budgets error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── CREATE / UPDATE budget (upsert) ─────────────────────
router.post('/', async (req, res) => {
  try {
    const { category_id, amount, month, year } = req.body;

    if (!category_id || !amount || !month || !year) {
      return res.status(400).json({ error: 'category_id, amount, month, year are required' });
    }

    await pool.query(
      `INSERT INTO budgets (user_id, category_id, amount, month, year)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
      [req.user.id, category_id, amount, month, year]
    );

    // Return updated list
    const [rows] = await pool.query(
      `SELECT b.*, c.name AS category_name, c.icon AS category_icon
         FROM budgets b JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = ? AND b.month = ? AND b.year = ?`,
      [req.user.id, month, year]
    );

    res.status(201).json(rows);
  } catch (err) {
    console.error('Create budget error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE budget ───────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM budgets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Budget not found' });
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
