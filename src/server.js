import express from 'express';
import dotenv from 'dotenv';
import pool from './config/database.js';
import cepRoutes from './routes/cep.routes.js';
import addressRoutes from './routes/address.routes.js';
import requestLogger from './middlewares/requestLogger.js';
import errorHandler from './middlewares/errorHandler.js';
import logger from './utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(express.json());
app.use(requestLogger);

// Servir arquivos estáticos (frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API
app.use('/cep', cepRoutes);
app.use('/addresses', addressRoutes);

// Rota principal -> carrega o frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Error handler (deve ser o último middleware)
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 SmartCEP rodando em http://localhost:${PORT}`);
  console.log(`✅ Acesse: http://localhost:${PORT}`);
});