const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// ── GET transactions (with JOINs, filtering, pagination) ──
router.get('/', async (req, res) => {
  try {
    const { type, category_id, account_id, start_date, end_date, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT t.*,
             a.name  AS account_name,
             c.name  AS category_name,
             c.icon  AS category_icon
        FROM transactions t
        JOIN accounts   a ON t.account_id  = a.id
        JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ?
    `;
    const params = [req.user.id];

    if (type) {
      sql += ' AND t.type = ?';
      params.push(type);
    }
    if (category_id) {
      sql += ' AND t.category_id = ?';
      params.push(category_id);
    }
    if (account_id) {
      sql += ' AND t.account_id = ?';
      params.push(account_id);
    }
    if (start_date) {
      sql += ' AND t.date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND t.date <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY t.date DESC, t.id DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── CREATE transaction ──────────────────────────────────
// Also updates the account balance (demonstrates MySQL transaction)
router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { account_id, category_id, type, amount, description, date } = req.body;

    if (!account_id || !category_id || !type || !amount || !date) {
      conn.release();
      return res.status(400).json({ error: 'account_id, category_id, type, amount, date are required' });
    }

    // Insert transaction
    const [result] = await conn.query(
      `INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, account_id, category_id, type, amount, description || '', date]
    );

    // Update account balance
    const balanceChange = type === 'income' ? Number(amount) : -Number(amount);
    await conn.query(
      'UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?',
      [balanceChange, account_id, req.user.id]
    );

    await conn.commit();

    // Return the new transaction with JOINed data
    const [rows] = await pool.query(
      `SELECT t.*, a.name AS account_name, c.name AS category_name, c.icon AS category_icon
         FROM transactions t
         JOIN accounts a   ON t.account_id  = a.id
         JOIN categories c ON t.category_id = c.id
        WHERE t.id = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

// ── DELETE transaction ──────────────────────────────────
// Reverses the balance change on the related account
router.delete('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get the transaction first
    const [txnRows] = await conn.query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (txnRows.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const txn = txnRows[0];

    // Reverse balance
    const reversal = txn.type === 'income' ? -Number(txn.amount) : Number(txn.amount);
    await conn.query(
      'UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?',
      [reversal, txn.account_id, req.user.id]
    );

    // Delete
    await conn.query('DELETE FROM transactions WHERE id = ?', [req.params.id]);

    await conn.commit();
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    await conn.rollback();
    console.error('Delete transaction error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

module.exports = router;
