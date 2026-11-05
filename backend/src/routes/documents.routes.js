const express = require('express');

function createDocumentsRouter({ controller, upload }) {
  const router = express.Router();

  router.post('/upload', controller.requireOwner, upload, controller.upload);
  router.get('/documents', controller.requireOwner, controller.list);
  router.get('/documents/:id/download', controller.requireOwner, controller.download);

  return router;
}

module.exports = { createDocumentsRouter };
