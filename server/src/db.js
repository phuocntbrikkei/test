const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Tạo bảng nếu chưa có và thêm 1 dòng mẫu khi bảng trống
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      text VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM messages');
  if (rows[0].total === 0) {
    await pool.query('INSERT INTO messages (text) VALUES (?)', ['Hello World from MySQL']);
  }
}

module.exports = { pool, initDb };
