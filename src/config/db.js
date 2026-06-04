const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Add it to .env before running the backend.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : { rejectUnauthorized: false }
});

const query = (text, params) => pool.query(text, params);

const testConnection = async () => {
  const result = await pool.query('SELECT NOW() AS current_time');
  return result.rows[0];
};

module.exports = { pool, query, testConnection };
