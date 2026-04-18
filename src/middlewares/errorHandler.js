import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  
  logger.error(`${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Erro interno no servidor',
    timestamp: new Date().toISOString()
  });
};

export default errorHandler;