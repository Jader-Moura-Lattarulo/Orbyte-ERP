const db = require('../server/db');

async function migrate() {
  try {
    console.log('--- Iniciando Migração de Banco de Dados ---');
    
    // 1. Adicionar coluna CEP se não existir
    console.log('Adicionando coluna cep...');
    await db.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS cep VARCHAR(10) AFTER document
    `);

    // 2. Tentar adicionar restrição UNIQUE para email
    console.log('Adicionando índice UNIQUE para email...');
    try {
      await db.query(`ALTER TABLE clients ADD UNIQUE INDEX idx_unique_email (email)`);
    } catch (e) {
      console.warn('Nota: Índice de e-mail já existe ou há duplicatas.');
    }

    // 3. Tentar adicionar restrição UNIQUE para document
    console.log('Adicionando índice UNIQUE para document...');
    try {
      await db.query(`ALTER TABLE clients ADD UNIQUE INDEX idx_unique_document (document)`);
    } catch (e) {
      console.warn('Nota: Índice de documento já existe ou há duplicatas.');
    }

    console.log('✅ Migração concluída com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro na migração:', err);
    process.exit(1);
  }
}

migrate();
