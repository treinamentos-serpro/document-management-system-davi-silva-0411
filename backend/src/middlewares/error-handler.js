const { AppError, sendError } = require('../http/errors');

function mapMulterError(error) {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return [413, 'FILE_TOO_LARGE', 'O arquivo excede o tamanho máximo permitido.'];
  }
  return [400, 'INVALID_UPLOAD', 'Não foi possível processar o arquivo enviado.'];
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof AppError) {
    return sendError(res, error.statusCode, error.code, error.message);
  }

  if (error.name === 'MulterError') {
    return sendError(res, ...mapMulterError(error));
  }

  console.error(`[${req.method} ${req.originalUrl}]`, error);
  return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Erro interno do servidor.');
}

module.exports = { errorHandler };
