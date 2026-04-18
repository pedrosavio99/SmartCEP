import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Testar conexão ao iniciar
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('❌ Erro ao conectar com o banco Neon:', err.message);
  } else {
    console.log('✅ Conectado ao banco Neon com sucesso!');
  }
});

export default pool;