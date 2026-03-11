/**
 * Run this script once to create all database tables.
 * Usage:  node db/runInit.js
 */
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');
require('dotenv').config();

async function init() {
  // Connect WITHOUT specifying a database so we can CREATE it
  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
  await connection.query(sql);

  console.log('✅ Database & tables created successfully!');
  await connection.end();
  process.exit(0);
}

init().catch((err) => {
  console.error('❌ Database init failed:', err.message);
  process.exit(1);
});
