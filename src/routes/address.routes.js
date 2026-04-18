import express from 'express';
import addressService from '../services/address.service.js';
import logger from '../utils/logger.js';

const router = express.Router();

// GET /addresses  → Listar todos os endereços salvos
router.get('/', async (req, res, next) => {
  try {
    const addresses = await addressService.listar();
    res.json({ success: true, data: addresses });
  } catch (error) {
    next(error);
  }
});

// POST /addresses  → Salvar um novo endereço com apelido
router.post('/', async (req, res, next) => {
  try {
    const { cep, apelido, ...dadosEndereco } = req.body;

    if (!cep || !apelido) {
      return res.status(400).json({ success: false, error: 'CEP e apelido são obrigatórios' });
    }

    const address = await addressService.criar(cep, apelido, dadosEndereco);

    logger.info(`Endereço salvo com apelido`, { cep, apelido });

    res.status(201).json({ success: true, data: address });
  } catch (error) {
    next(error);
  }
});

// PUT /addresses/:id  → Atualizar apelido
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { apelido } = req.body;

    if (!apelido) {
      return res.status(400).json({ success: false, error: 'Apelido é obrigatório' });
    }

    const address = await addressService.atualizar(id, apelido);

    if (!address) {
      return res.status(404).json({ success: false, error: 'Endereço não encontrado' });
    }

    logger.info(`Apelido atualizado`, { id, apelido });

    res.json({ success: true, data: address });
  } catch (error) {
    next(error);
  }
});

// DELETE /addresses/:id  → Deletar endereço
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await addressService.deletar(id);

    logger.info(`Endereço deletado`, { id });

    res.json({ success: true, message: 'Endereço deletado com sucesso' });
  } catch (error) {
    next(error);
  }
});

export default router;