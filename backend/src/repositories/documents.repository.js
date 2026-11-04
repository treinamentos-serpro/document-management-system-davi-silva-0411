const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');

function createDocumentsRepository() {
  const documents = new Map();

  return {
    create(documentData) {
      const document = { id: randomUUID(), ...documentData };
      documents.set(document.id, document);
      return { ...document };
    },

    listByOwner(owner) {
      return Array.from(documents.values())
        .filter((document) => document.owner === owner)
        .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
        .map((document) => ({ ...document }));
    },

    findById(id) {
      const document = documents.get(id);
      return document ? { ...document } : null;
    },

    async removeStoredFile(filePath) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    },
  };
}

module.exports = { createDocumentsRepository };