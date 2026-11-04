const { sendError } = require('../http/errors');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OWNER_PATTERN = /^[\w.@-]{1,128}$/;

const DOWNLOAD_HEADERS = {
  'Content-Type': 'application/octet-stream',
  'Cache-Control': 'private, no-store',
};

function requireOwner(req, res, next) {
  const owner = req.get('X-User-Id')?.trim();
  if (!owner || !OWNER_PATTERN.test(owner)) {
    return sendError(
      res,
      400,
      'INVALID_USER',
      'Informe um identificador de usuário válido (letras, números, ".", "_", "-" ou "@", até 128 caracteres).'
    );
  }

  req.owner = owner;
  return next();
}

function createDocumentsController(service) {
  return {
    requireOwner,

    upload: async (req, res) => {
      if (!req.file) {
        return sendError(res, 400, 'FILE_REQUIRED', 'Envie um arquivo no campo "file".');
      }

      const document = await service.registerUpload(req.file, req.owner);
      return res.status(201).json(document);
    },

    list: (req, res) => res.json(service.listDocuments(req.owner)),

    download: (req, res, next) => {
      if (!UUID_PATTERN.test(req.params.id)) {
        return sendError(res, 400, 'INVALID_DOCUMENT_ID', 'O identificador do documento é inválido.');
      }

      const document = service.findOwnedDocument(req.params.id, req.owner);
      if (!document) {
        return sendError(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
      }

      const options = { root: document.root, headers: DOWNLOAD_HEADERS };
      return res.download(document.fileName, document.originalName, options, (error) => {
        if (!error) return;
        if (res.headersSent) {
          res.destroy(error);
          return;
        }
        if (error.code === 'ENOENT') {
          sendError(res, 404, 'FILE_NOT_FOUND', 'O arquivo deste documento não está disponível.');
          return;
        }
        next(error);
      });
    },
  };
}

module.exports = { createDocumentsController, requireOwner };
