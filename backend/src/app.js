const express = require('express');
const path = require('node:path');
const { createDocumentsRepository } = require('./repositories/documents.repository');
const { createDocumentsService } = require('./services/documents.service');
const { createDocumentsController } = require('./controllers/documents.controller');
const { createDocumentsRouter } = require('./routes/documents.routes');

const STORAGE_DIRECTORY = path.resolve(__dirname, '../storage');
const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function getMaxFileSizeBytes() {
  const configuredValue = Number.parseInt(process.env.MAX_FILE_SIZE_BYTES, 10);
  return Number.isInteger(configuredValue) && configuredValue > 0
    ? configuredValue
    : DEFAULT_MAX_FILE_SIZE_BYTES;
}

function createApp({
  storageDirectory = STORAGE_DIRECTORY,
  maxFileSizeBytes = getMaxFileSizeBytes(),
} = {}) {
  const app = express();
  const repository = createDocumentsRepository();
  const service = createDocumentsService(repository);
  const controller = createDocumentsController(service);

  app.use(express.json());
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(createDocumentsRouter({ controller, storageDirectory, maxFileSizeBytes }));
  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    if (error.name === 'MulterError') {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE';
      return res.status(tooLarge ? 413 : 400).json({
        error: {
          code: tooLarge ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD',
          message: tooLarge
            ? 'O arquivo excede o tamanho máximo permitido.'
            : 'Não foi possível processar o arquivo enviado.',
        },
      });
    }

    if (error.code === 'ENOENT') {
      return res.status(404).json({
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'O arquivo deste documento não está disponível.',
        },
      });
    }

    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro interno do servidor.',
      },
    });
  });

  return app;
}

const app = createApp();
app.createApp = createApp;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
