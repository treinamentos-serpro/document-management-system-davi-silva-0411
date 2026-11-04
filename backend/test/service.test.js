const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDocumentsService, sanitizeOriginalName } = require('../src/services/documents.service');

test('sanitizeOriginalName remove diretórios, caracteres de controle e limita o tamanho', () => {
  assert.equal(sanitizeOriginalName('../../etc/passwd'), 'passwd');
  assert.equal(sanitizeOriginalName('..\\..\\boot.ini'), 'boot.ini');
  assert.equal(sanitizeOriginalName('/abs/path/file.txt'), 'file.txt');
  assert.equal(sanitizeOriginalName('a\u0000b\r\nc.txt'), 'abc.txt');
  assert.equal(sanitizeOriginalName('  nome.pdf  '), 'nome.pdf');
  assert.equal(sanitizeOriginalName('x'.repeat(300)).length, 255);
  for (const empty of ['', '   ', '.', '..', '../', undefined, null]) {
    assert.equal(sanitizeOriginalName(empty), 'documento', String(empty));
  }
});

test('registerUpload remove o arquivo enviado quando o registro falha', async () => {
  const removed = [];
  const repository = {
    usageByOwner: () => ({ count: 0, bytes: 0 }),
    create: () => {
      throw new Error('falha');
    },
    removeStoredFile: async (storedName) => removed.push(storedName),
  };
  const service = createDocumentsService(repository, { maxFilesPerUser: 10, maxBytesPerUser: 100 });

  await assert.rejects(
    service.registerUpload({ filename: 'stored-id', originalname: 'a.txt', size: 1 }, 'user-a'),
    /falha/
  );
  assert.deepEqual(removed, ['stored-id']);
});
