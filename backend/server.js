const path = require('path');
const express = require('express');
const cors = require('cors');
const { pool, migrate } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- API routes ---

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

app.get('/api/todos', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, text, done, created_at FROM todos ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/todos', async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO todos (text) VALUES ($1) RETURNING id, text, done, created_at',
      [text.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'UPDATE todos SET done = NOT done WHERE id = $1 RETURNING id, text, done, created_at',
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM todos WHERE id = $1', [id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Serve built React frontend ---
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

async function start() {
  try {
    await migrate();
  } catch (err) {
    console.error('[db] Migration failed:', err.message);
  }
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start();
