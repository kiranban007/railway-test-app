const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.warn(
    '[db] DATABASE_URL is not set. On Railway, add a PostgreSQL plugin ' +
    'and reference its DATABASE_URL in this service\'s variables.'
  );
}

// Railway's PostgreSQL plugin usually doesn't require SSL on the internal
// network, but the public proxy connection does. This works for both.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('[db] Unexpected pool error (idle client):', err);
});

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('[db] Migration check complete (todos table ready).');
}

module.exports = { pool, migrate };
