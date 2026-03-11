const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');

const router = express.Router();

// All routes below require authentication
router.use(auth);

// ── GET all accounts for the logged-in user ─────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET single account ──────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Account not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── CREATE account ──────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, type, balance } = req.body;
    if (!name) return res.status(400).json({ error: 'Account name is required' });

    const [result] = await pool.query(
      'INSERT INTO accounts (user_id, name, type, balance) VALUES (?, ?, ?, ?)',
      [req.user.id, name, type || 'checking', balance || 0]
    );

    const [rows] = await pool.query('SELECT * FROM accounts WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── UPDATE account ──────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { name, type, balance } = req.body;

    await pool.query(
      `UPDATE accounts SET name = COALESCE(?, name),
                           type = COALESCE(?, type),
                           balance = COALESCE(?, balance)
       WHERE id = ? AND user_id = ?`,
      [name, type, balance, req.params.id, req.user.id]
    );

    const [rows] = await pool.query(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Account not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE account ──────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM accounts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Account not found' });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
