const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

// ── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://fintrack-ruddy-psi.vercel.app',  // replace with your actual Vercel URL
  ],
  credentials: true,
}));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/accounts',     require('./routes/accounts'));
app.use('/api/categories',   require('./routes/categories'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/budgets',      require('./routes/budgets'));
app.use('/api/dashboard',    require('./routes/dashboard'));
app.use('/api/insights',     require('./routes/insights'));

// ── Health check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── Start ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
