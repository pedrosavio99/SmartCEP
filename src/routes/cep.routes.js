import express from 'express';
import cepService from '../services/cep.service.js';
import logger from '../utils/logger.js';

const router = express.Router();

// GET /cep/:cep  → Busca resiliente (cache → BrasilAPI → ViaCEP)
router.get('/:cep', async (req, res, next) => {
  try {
    const { cep } = req.params;
    const resultado = await cepService.buscar(cep);

    logger.info(`Busca de CEP realizada`, {
      cep,
      source: resultado.source,
      latency: resultado.latency || 0
    });

    res.json({
      success: true,
      ...resultado
    });
  } catch (error) {
    next(error);
  }
});

export default router;