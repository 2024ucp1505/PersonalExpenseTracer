const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// ── GET all categories for user ─────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY type, name',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── CREATE category ─────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, type, icon } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const [result] = await pool.query(
      'INSERT INTO categories (user_id, name, type, icon) VALUES (?, ?, ?, ?)',
      [req.user.id, name, type || 'expense', icon || '📁']
    );

    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── UPDATE category ─────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { name, type, icon } = req.body;

    await pool.query(
      `UPDATE categories SET name = COALESCE(?, name),
                             type = COALESCE(?, type),
                             icon = COALESCE(?, icon)
       WHERE id = ? AND user_id = ?`,
      [name, type, icon, req.params.id, req.user.id]
    );

    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE category ─────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM categories WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
