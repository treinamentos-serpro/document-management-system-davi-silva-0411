const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sendError(res, statusCode, code, message) {
  return res.status(statusCode).json({ error: { code, message } });
}

function createDocumentsController(service) {
  function requireOwner(req, res, next) {
    const owner = req.get('X-User-Id')?.trim();
    if (!owner || owner.length > 128) {
      return sendError(res, 400, 'INVALID_USER', 'Informe um identificador de usuário válido.');
    }

    req.owner = owner;
    return next();
  }

  return {
    requireOwner,

    upload: async (req, res, next) => {
      try {
        if (!req.file) {
          return sendError(res, 400, 'FILE_REQUIRED', 'Envie um arquivo no campo "file".');
        }

        const document = await service.registerUpload(req.file, req.owner);
        return res.status(201).json(document);
      } catch (error) {
        return next(error);
      }
    },

    list: (req, res, next) => {
      try {
        return res.json(service.listDocuments(req.owner));
      } catch (error) {
        return next(error);
      }
    },

    download: (req, res, next) => {
      if (!UUID_PATTERN.test(req.params.id)) {
        return sendError(res, 400, 'INVALID_DOCUMENT_ID', 'O identificador do documento é inválido.');
      }

      const document = service.findOwnedDocument(req.params.id, req.owner);
      if (!document) {
        return sendError(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
      }

      return res.download(document.filePath, document.originalName, (error) => {
        if (error && !res.headersSent) {
          next(error);
        }
      });
    },
  };
}

module.exports = { createDocumentsController };