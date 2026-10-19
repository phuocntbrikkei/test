const express = require('express');
const { pool, initDb } = require('./db');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: err.message });
  }
});

app.get('/api/messages', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, text, created_at FROM messages ORDER BY id DESC'
  );
  res.json(rows);
});

app.post('/api/messages', async (req, res) => {
  const text = String(req.body?.text ?? '').trim();
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  const [result] = await pool.query('INSERT INTO messages (text) VALUES (?)', [
    text.slice(0, 255),
  ]);
  res.status(201).json({ id: result.insertId, text });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  });
