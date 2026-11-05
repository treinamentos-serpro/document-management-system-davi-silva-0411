const fs = require('node:fs/promises');
const path = require('node:path');

const KEEP_FILES = new Set(['.gitkeep']);

function createDocumentsRepository({ storageDirectory }) {
  const documents = new Map();

  // O basename impede que um nome armazenado saia do diretório de storage.
  function storedFilePath(storedName) {
    return path.join(storageDirectory, path.basename(storedName));
  }

  return {
    create(document) {
      documents.set(document.id, { ...document });
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

    usageByOwner(owner) {
      let count = 0;
      let bytes = 0;
      for (const document of documents.values()) {
        if (document.owner === owner) {
          count += 1;
          bytes += document.size;
        }
      }
      return { count, bytes };
    },

    getFileLocation(document) {
      return { root: storageDirectory, fileName: path.basename(document.storedName) };
    },

    async removeStoredFile(storedName) {
      await fs.rm(storedFilePath(storedName), { force: true });
    },
  };
}

// Os metadados ficam em memória; na inicialização, todo arquivo existente é órfão.
async function clearStorageDirectory(storageDirectory) {
  await fs.mkdir(storageDirectory, { recursive: true });
  const entries = await fs.readdir(storageDirectory);
  const removable = entries.filter((entry) => !KEEP_FILES.has(entry));
  await Promise.all(
    removable.map((entry) => fs.rm(path.join(storageDirectory, entry), { force: true, recursive: true }))
  );
  return removable.length;
}

module.exports = { createDocumentsRepository, clearStorageDirectory };
