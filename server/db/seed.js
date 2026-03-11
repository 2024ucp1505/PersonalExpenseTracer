/**
 * Seed script — inserts demo data for quick testing.
 * Usage:  node db/seed.js
 */
const pool   = require('../config/db');
const bcrypt = require('bcryptjs');

async function seed() {
  const conn = await pool.getConnection();
  try {
    // 1. Demo user
    const hash = await bcrypt.hash('password123', 10);
    const [userResult] = await conn.query(
      `INSERT INTO users (name, email, password) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      ['Demo User', 'demo@example.com', hash]
    );
    const userId = userResult.insertId || 1;

    // 2. Accounts
    await conn.query(
      `INSERT IGNORE INTO accounts (id, user_id, name, type, balance) VALUES
        (1, ?, 'Main Checking',  'checking',    5200.00),
        (2, ?, 'Savings Goal',   'savings',    12500.00),
        (3, ?, 'Credit Card',    'credit_card', -840.00),
        (4, ?, 'Cash Wallet',    'cash',         320.00)`,
      [userId, userId, userId, userId]
    );

    // 3. Categories
    await conn.query(
      `INSERT IGNORE INTO categories (id, user_id, name, type, icon) VALUES
        (1,  ?, 'Salary',         'income',  '💰'),
        (2,  ?, 'Freelance',      'income',  '💻'),
        (3,  ?, 'Food & Dining',  'expense', '🍔'),
        (4,  ?, 'Transport',      'expense', '🚗'),
        (5,  ?, 'Entertainment',  'expense', '🎬'),
        (6,  ?, 'Shopping',       'expense', '🛍️'),
        (7,  ?, 'Utilities',      'expense', '💡'),
        (8,  ?, 'Rent',           'expense', '🏠'),
        (9,  ?, 'Healthcare',     'expense', '🏥'),
        (10, ?, 'Investment',     'income',  '📈')`,
      [userId, userId, userId, userId, userId, userId, userId, userId, userId, userId]
    );

    // 4. Transactions (last 3 months)
    const txns = [
      [1, 1, 1, 'income',  4500, 'March salary',         '2026-03-01'],
      [1, 1, 2, 'income',  800,  'Web dev project',      '2026-03-03'],
      [1, 1, 3, 'expense', 45,   'Lunch with team',      '2026-03-04'],
      [1, 3, 6, 'expense', 120,  'New headphones',       '2026-03-05'],
      [1, 1, 4, 'expense', 30,   'Uber ride',            '2026-03-06'],
      [1, 1, 7, 'expense', 85,   'Electricity bill',     '2026-03-07'],
      [1, 1, 8, 'expense', 1200, 'Monthly rent',         '2026-03-01'],
      [1, 1, 5, 'expense', 15,   'Netflix subscription', '2026-03-01'],
      [1, 1, 3, 'expense', 60,   'Grocery run',          '2026-02-28'],
      [1, 2, 10,'income',  200,  'Mutual fund returns',  '2026-02-25'],
      [1, 1, 4, 'expense', 50,   'Monthly metro pass',   '2026-02-01'],
      [1, 1, 1, 'income',  4500, 'Feb salary',           '2026-02-01'],
      [1, 1, 3, 'expense', 35,   'Coffee shop',          '2026-02-15'],
      [1, 1, 8, 'expense', 1200, 'Feb rent',             '2026-02-01'],
      [1, 1, 9, 'expense', 150,  'Doctor visit',         '2026-02-10'],
      [1, 1, 5, 'expense', 25,   'Movie tickets',        '2026-01-20'],
      [1, 1, 1, 'income',  4500, 'Jan salary',           '2026-01-01'],
      [1, 1, 6, 'expense', 250,  'Winter jacket',        '2026-01-15'],
      [1, 4, 3, 'expense', 20,   'Street food',          '2026-01-18'],
      [1, 1, 7, 'expense', 90,   'Internet bill',        '2026-01-05'],
    ];

    for (const t of txns) {
      await conn.query(
        `INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`, t
      );
    }

    // 5. Budgets for March 2026
    await conn.query(
      `INSERT IGNORE INTO budgets (user_id, category_id, amount, month, year) VALUES
        (?, 3, 300,  3, 2026),
        (?, 4, 100,  3, 2026),
        (?, 5, 50,   3, 2026),
        (?, 6, 200,  3, 2026),
        (?, 7, 150,  3, 2026),
        (?, 8, 1200, 3, 2026),
        (?, 9, 200,  3, 2026)`,
      [userId, userId, userId, userId, userId, userId, userId]
    );

    console.log('✅ Seed data inserted successfully!');
    console.log('   Login with:  demo@example.com / password123');
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
