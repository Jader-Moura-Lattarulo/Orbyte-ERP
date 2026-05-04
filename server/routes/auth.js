const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('ERRO NO LOGIN:', err);
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    res.status(500).json({ error: 'Erro no servidor.', details: err.message });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

router.post('/verify-identity', async (req, res) => {
  const { email, birthdate } = req.body;
  try {
    const [rows] = await db.query('SELECT birth_date FROM users WHERE email = ?', [email]);
    if (!rows[0]) return res.status(404).json({ error: 'Usuário não encontrado.' });
    
    // Formata a data do banco com segurança (sem fuso horário)
    const date = new Date(rows[0].birth_date);
    const dbDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    if (dbDate !== birthdate) return res.status(400).json({ error: 'Dados não conferem.' });
    res.json({ verified: true });
  } catch (err) {
    console.error('Erro ao verificar identidade:', err);
    res.status(500).json({ error: 'Erro no servidor.', details: err.message });
  }
});

router.post('/recover-password', async (req, res) => {
  const { email, birthdate, newPassword } = req.body;
  try {
    const [rows] = await db.query('SELECT id, birth_date FROM users WHERE email = ?', [email]);
    if (!rows[0]) return res.status(404).json({ error: 'Usuário não encontrado.' });
    const date = new Date(rows[0].birth_date);
    const dbDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    if (dbDate !== birthdate) return res.status(400).json({ error: 'Dados não conferem.' });

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, rows[0].id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao recuperar senha:', err);
    res.status(500).json({ error: 'Erro no servidor.', details: err.message });
  }
});

router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, role, birth_date as birthDate FROM users');
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
});

router.post('/users', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, email, password, role, birthDate } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (name, email, password_hash, role, birth_date) VALUES (?, ?, ?, ?, ?)', 
      [name, email, hash, role, birthDate]);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
});

router.put('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, role, birthDate, password } = req.body;
  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await db.query('UPDATE users SET name=?, role=?, birth_date=?, password_hash=? WHERE id=?', [name, role, birthDate, hash, req.params.id]);
    } else {
      await db.query('UPDATE users SET name=?, role=?, birth_date=? WHERE id=?', [name, role, birthDate, req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar usuário.' });
  }
});

module.exports = router;
