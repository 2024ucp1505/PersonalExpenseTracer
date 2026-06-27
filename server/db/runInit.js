/**
 * Run this script once to create all database tables.
 * Usage:  node db/runInit.js
 */
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');
require('dotenv').config();

async function init() {
  let connection;
  let sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');

  if (process.env.MYSQL_URL) {
    console.log('Connecting via MYSQL_URL...');
    let url = process.env.MYSQL_URL;
    if (url.includes('?')) {
      url += '&multipleStatements=true';
    } else {
      url += '?multipleStatements=true';
    }
    connection = await mysql.createConnection(url);

    // Strip out CREATE DATABASE and USE statements so tables are created in the database specified in MYSQL_URL
    sql = sql.replace(/CREATE DATABASE IF NOT EXISTS [a-zA-Z0-9_]+;/i, '-- CREATE DATABASE bypassed for cloud');
    sql = sql.replace(/USE [a-zA-Z0-9_]+;/i, '-- USE bypassed for cloud');
  } else {
    console.log('Connecting via local credentials...');
    // Connect WITHOUT specifying a database so we can CREATE it
    connection = await mysql.createConnection({
      host:     process.env.DB_HOST,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true,
    });
  }

  await connection.query(sql);

  console.log('✅ Database & tables created successfully!');
  await connection.end();
  process.exit(0);
}

init().catch((err) => {
  console.error('❌ Database init failed:', err.message);
  process.exit(1);
});
