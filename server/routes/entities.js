const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { validateClient } = require('../validators/clientValidator');

const TABLE_MAP = {
  Technician: 'technicians',
  technicians: 'technicians',
  ServiceOrder: 'service_orders',
  service_orders: 'service_orders',
  Client: 'clients',
  clients: 'clients',
  InventoryItem: 'inventory_items',
  inventory_items: 'inventory_items',
  FinancialEntry: 'financial_entries',
  financial_entries: 'financial_entries',
  Appointment: 'appointments',
  appointments: 'appointments'
};

router.use(authMiddleware);

router.get('/:entity', async (req, res) => {
  const table = TABLE_MAP[req.params.entity];
  if (!table) return res.status(404).json({ error: 'Entidade inválida.' });
  try {
    const [rows] = await db.query(`SELECT * FROM ${table} ORDER BY created_date DESC`);
    const parsed = rows.map(row => {
      const r = { ...row };
      ['tags', 'parts_used', 'photos'].forEach(key => {
        if (r[key] && typeof r[key] === 'string') {
          try { r[key] = JSON.parse(r[key]); } catch {}
        }
      });
      return r;
    });
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar.' });
  }
});

router.post('/:entity', async (req, res) => {
  const entityName = req.params.entity;
  const table = TABLE_MAP[entityName];
  if (!table) return res.status(404).json({ error: 'Entidade inválida.' });

  let data = { ...req.body };

  // Validação específica para Clientes
  if (table === 'clients') {
    const validation = validateClient(data);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos.', 
        details: validation.error.format() 
      });
    }
    data = validation.data; // Pega os dados sanitizados e desmascarados
  }

  try {
    ['tags', 'parts_used', 'photos'].forEach(key => {
      if (data[key] && typeof data[key] !== 'string') data[key] = JSON.stringify(data[key]);
    });
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map(() => '?').join(', ');
    await db.query(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`, values);
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Já existe um cliente com este e-mail ou documento.' });
    }
    res.status(500).json({ error: 'Erro ao criar.', message: err.message });
  }
});

router.put('/:entity/:id', async (req, res) => {
  const entityName = req.params.entity;
  const table = TABLE_MAP[entityName];
  if (!table) return res.status(404).json({ error: 'Entidade inválida.' });

  let data = { ...req.body };

  // Validação específica para Clientes
  if (table === 'clients') {
    const validation = validateClient(data);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos.', 
        details: validation.error.format() 
      });
    }
    data = validation.data;
  }

  try {
    ['tags', 'parts_used', 'photos'].forEach(key => {
      if (data[key] && typeof data[key] !== 'string') data[key] = JSON.stringify(data[key]);
    });
    const setClause = Object.keys(data).map(k => `${k}=?`).join(', ');
    const values = [...Object.values(data), req.params.id];
    await db.query(`UPDATE ${table} SET ${setClause} WHERE id=?`, values);
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Já existe um cliente com este e-mail ou documento.' });
    }
    res.status(500).json({ error: 'Erro ao atualizar.', message: err.message });
  }
});

router.delete('/:entity/:id', async (req, res) => {
  const table = TABLE_MAP[req.params.entity];
  if (!table) return res.status(404).json({ error: 'Entidade inválida.' });
  try {
    await db.query(`DELETE FROM ${table} WHERE id=?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar.' });
  }
});

module.exports = router;
