function createDocumentsService(repository) {
  return {
    async registerUpload(file, owner) {
      try {
        const document = repository.create({
          originalName: file.originalname,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          owner,
          filePath: file.path,
        });
        const { filePath, ...metadata } = document;
        return metadata;
      } catch (error) {
        await repository.removeStoredFile(file.path).catch(() => {});
        throw error;
      }
    },

    listDocuments(owner) {
      return repository.listByOwner(owner).map(({ filePath, ...document }) => document);
    },

    findOwnedDocument(id, owner) {
      const document = repository.findById(id);
      return document && document.owner === owner ? document : null;
    },
  };
}

module.exports = { createDocumentsService };