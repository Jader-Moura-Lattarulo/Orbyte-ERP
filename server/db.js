const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '-03:00'
});

module.exports = pool;

// Teste de conexão imediato
pool.getConnection()
  .then(conn => {
    console.log('✅ Conexão com o banco de dados cPanel estabelecida com SUCESSO!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ FALHA CRÍTICA na conexão com o banco de dados:', err.message);
  });
