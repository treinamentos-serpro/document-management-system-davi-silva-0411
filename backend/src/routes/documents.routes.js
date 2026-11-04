const express = require('express');
const multer = require('multer');
const { randomUUID } = require('node:crypto');

function createDocumentsRouter({ controller, storageDirectory, maxFileSizeBytes }) {
  const router = express.Router();
  const upload = multer({
    storage: multer.diskStorage({
      destination: storageDirectory,
      filename: (req, file, callback) => callback(null, randomUUID()),
    }),
    limits: { fileSize: maxFileSizeBytes },
  }).single('file');

  router.post('/upload', controller.requireOwner, upload, controller.upload);
  router.get('/documents', controller.requireOwner, controller.list);
  router.get('/documents/:id/download', controller.requireOwner, controller.download);

  return router;
}

module.exports = { createDocumentsRouter };