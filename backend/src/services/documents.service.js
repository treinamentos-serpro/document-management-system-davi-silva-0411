const path = require('node:path');
const { AppError } = require('../http/errors');

const MAX_NAME_LENGTH = 255;
const FALLBACK_NAME = 'documento';

function sanitizeOriginalName(name) {
  const baseName = path.posix.basename(String(name ?? '').replace(/\\/g, '/'));
  const cleaned = baseName.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!cleaned || cleaned === '.' || cleaned === '..') {
    return FALLBACK_NAME;
  }
  return cleaned.slice(0, MAX_NAME_LENGTH);
}

function toPublicDocument({ storedName, ...document }) {
  return document;
}

function createDocumentsService(repository, { maxFilesPerUser, maxBytesPerUser }) {
  function assertWithinQuota(owner, fileSize) {
    const usage = repository.usageByOwner(owner);
    if (usage.count + 1 > maxFilesPerUser || usage.bytes + fileSize > maxBytesPerUser) {
      throw new AppError(413, 'QUOTA_EXCEEDED', 'Limite de armazenamento do usuário atingido.');
    }
  }

  return {
    async registerUpload(file, owner) {
      try {
        assertWithinQuota(owner, file.size);
        const document = repository.create({
          id: file.filename,
          originalName: sanitizeOriginalName(file.originalname),
          size: file.size,
          uploadedAt: new Date().toISOString(),
          owner,
          storedName: file.filename,
        });
        return toPublicDocument(document);
      } catch (error) {
        await repository.removeStoredFile(file.filename).catch(() => {});
        throw error;
      }
    },

    listDocuments(owner) {
      return repository.listByOwner(owner).map(toPublicDocument);
    },

    findOwnedDocument(id, owner) {
      const document = repository.findById(id);
      if (!document || document.owner !== owner) {
        return null;
      }
      return { ...toPublicDocument(document), ...repository.getFileLocation(document) };
    },
  };
}

module.exports = { createDocumentsService, sanitizeOriginalName };
