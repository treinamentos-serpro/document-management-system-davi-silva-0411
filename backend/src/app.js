const express = require('express');
const { loadConfig } = require('./config');
const { createDocumentsRepository } = require('./repositories/documents.repository');
const { createDocumentsService } = require('./services/documents.service');
const { createDocumentsController } = require('./controllers/documents.controller');
const { createDocumentsRouter } = require('./routes/documents.routes');
const { createUploadMiddleware } = require('./middlewares/upload');
const { securityHeaders } = require('./middlewares/security-headers');
const { errorHandler } = require('./middlewares/error-handler');

function createApp(overrides = {}) {
  const config = { ...loadConfig(), ...overrides };
  const repository = createDocumentsRepository({ storageDirectory: config.storageDirectory });
  const service = createDocumentsService(repository, config);
  const controller = createDocumentsController(service);
  const upload = createUploadMiddleware(config);

  const app = express();
  app.disable('x-powered-by');
  app.use(securityHeaders);

  const healthHandler = (req, res) => res.json({ status: 'ok' });
  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);
  app.use('/api', createDocumentsRouter({ controller, upload }));
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
