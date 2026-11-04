const multer = require('multer');
const { randomUUID } = require('node:crypto');

// O nome em disco é sempre um UUID gerado pelo servidor e também é o id do documento.
function createUploadMiddleware({ storageDirectory, maxFileSizeBytes }) {
  return multer({
    storage: multer.diskStorage({
      destination: storageDirectory,
      filename: (req, file, callback) => callback(null, randomUUID()),
    }),
    defParamCharset: 'utf8',
    limits: { fileSize: maxFileSizeBytes, files: 1, fields: 0 },
  }).single('file');
}

module.exports = { createUploadMiddleware };
