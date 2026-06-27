const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// ── DB Schema passed to the LLM as context ─────────────────────────────────
const DB_SCHEMA = `
Database: finance_tracker (MySQL)
All tables are scoped to the logged-in user via user_id.

TABLE users
  id          INT PK
  name        VARCHAR(100)
  email       VARCHAR(150) UNIQUE
  created_at  TIMESTAMP

TABLE accounts
  id          INT PK
  user_id     INT FK → users.id
  name        VARCHAR(100)
  type        ENUM('checking','savings','credit_card','cash','investment')
  balance     DECIMAL(12,2)
  created_at  TIMESTAMP

TABLE categories
  id          INT PK
  user_id     INT FK → users.id
  name        VARCHAR(80)
  type        ENUM('income','expense')
  icon        VARCHAR(50)
  created_at  TIMESTAMP

TABLE transactions
  id           INT PK
  user_id      INT FK → users.id
  account_id   INT FK → accounts.id
  category_id  INT FK → categories.id
  type         ENUM('income','expense')
  amount       DECIMAL(12,2)
  description  VARCHAR(255)
  date         DATE
  created_at   TIMESTAMP

TABLE budgets
  id           INT PK
  user_id      INT FK → users.id
  category_id  INT FK → categories.id
  amount       DECIMAL(12,2)   -- budgeted amount
  month        TINYINT         -- 1-12
  year         SMALLINT
  created_at   TIMESTAMP
`;

// ── Blocked SQL keywords (safety check) ────────────────────────────────────
const BLOCKED_PATTERN = /\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|REPLACE|GRANT|REVOKE|EXEC|EXECUTE|CALL)\b/i;

// ── Initialize Gemini ───────────────────────────────────────────────────────
function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured. Please add your key to server/.env');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

// ── POST /api/insights ──────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'A non-empty query string is required.' });
  }

  const userId = req.user.id;
  let model;

  try {
    model = getGeminiModel();
  } catch (err) {
    return res.status(503).json({ error: err.message });
  }

  // ── STEP A: Natural Language → SQL ─────────────────────────────────────
  const sqlPrompt = `
You are a MySQL expert. Given the database schema below and a user's natural language question, generate a single valid MySQL SELECT query.

RULES:
- Only produce a SELECT statement. Never use INSERT, UPDATE, DELETE, DROP, TRUNCATE, or ALTER.
- Always filter data by the logged-in user using WHERE user_id = ${userId} (or the appropriate table alias).
- Use JOINs where needed to get readable names (e.g. category names, account names).
- Return ONLY the raw SQL query — no markdown, no backticks, no explanation.
- If the question cannot be answered with the available schema, return: SELECT 'I cannot answer that with the available data' AS message;

DATABASE SCHEMA:
${DB_SCHEMA}

USER QUESTION: ${query.trim()}
`;

  let generatedSQL;
  try {
    const sqlResult = await model.generateContent(sqlPrompt);
    generatedSQL = sqlResult.response.text().trim();

    // Strip accidental markdown code fences
    generatedSQL = generatedSQL.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
  } catch (err) {
    console.error('Gemini SQL generation error:', err);
    return res.status(502).json({ error: 'Failed to generate SQL from your query. Please try again.' });
  }

  // ── SAFETY CHECK ──────────────────────────────────────────────────────
  if (BLOCKED_PATTERN.test(generatedSQL)) {
    console.warn(`[SECURITY] Blocked SQL attempt by user ${userId}:`, generatedSQL);
    return res.status(400).json({
      error: 'The generated SQL contains unsafe operations (INSERT/UPDATE/DELETE/DROP etc.) and was blocked.',
      generated_sql: generatedSQL,
    });
  }

  if (!generatedSQL.trim().toUpperCase().startsWith('SELECT')) {
    return res.status(400).json({
      error: 'The generated statement is not a SELECT query and was blocked for safety.',
      generated_sql: generatedSQL,
    });
  }

  // Block direct access to the users table (prevents password/email exposure)
  if (/\bFROM\s+users\b/i.test(generatedSQL)) {
    console.warn(`[SECURITY] Blocked users-table access by user ${userId}:`, generatedSQL);
    return res.status(400).json({ error: 'Direct access to the users table is not permitted.' });
  }

  // Block UNION-based cross-table exfiltration
  if (/\bUNION\b|\bINTO\s+OUTFILE\b|\bLOAD_FILE\b/i.test(generatedSQL)) {
    console.warn(`[SECURITY] Blocked UNION/OUTFILE attempt by user ${userId}:`, generatedSQL);
    return res.status(400).json({ error: 'Query contains disallowed SQL patterns.' });
  }

  // Verify user_id scoping is present (prevents cross-user data access)
  if (!/user_id\s*=\s*\d+/i.test(generatedSQL)) {
    console.warn(`[SECURITY] Blocked unscoped query by user ${userId}:`, generatedSQL);
    return res.status(400).json({ error: 'Query must be scoped to your user data.' });
  }

  // ── STEP B: Execute the SQL ────────────────────────────────────────────
  let rows;
  try {
    const [results] = await pool.query(generatedSQL);
    rows = results;
  } catch (err) {
    console.error('SQL execution error:', err);
    return res.status(500).json({
      error: 'The generated SQL could not be executed. Try rephrasing your question.',
      generated_sql: generatedSQL,
      db_error: err.message,
    });
  }

  // ── STEP C: SQL Results → Conversational Insight ──────────────────────
  const insightPrompt = `
You are a friendly personal finance assistant. The user asked:
"${query.trim()}"

The database returned the following data:
${JSON.stringify(rows, null, 2)}

Based on this data, provide a concise, helpful, and conversational financial insight.
- Use Indian Rupee (₹) for currency values.
- Keep the response under 4 sentences.
- Be encouraging and actionable.
- If there is no data, say so helpfully.
`;

  let insight;
  try {
    const insightResult = await model.generateContent(insightPrompt);
    insight = insightResult.response.text().trim();
  } catch (err) {
    console.error('Gemini insight generation error:', err);
    return res.status(502).json({ error: 'Failed to generate insight. Please try again.' });
  }

  return res.json({
    insight,
    sql: generatedSQL,
    rows,
  });
});

module.exports = router;
