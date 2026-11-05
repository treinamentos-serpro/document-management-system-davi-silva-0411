const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {
  createDocumentsRepository,
  clearStorageDirectory,
} = require('../src/repositories/documents.repository');
const { createTempDirectory } = require('./helpers');

test('clearStorageDirectory remove arquivos órfãos e mantém o .gitkeep', async (context) => {
  const storageDirectory = await createTempDirectory();
  context.after(() => fs.rm(storageDirectory, { recursive: true, force: true }));
  await fs.writeFile(path.join(storageDirectory, '.gitkeep'), '');
  await fs.writeFile(path.join(storageDirectory, 'orphan-1'), 'x');
  await fs.writeFile(path.join(storageDirectory, 'orphan-2'), 'y');

  assert.equal(await clearStorageDirectory(storageDirectory), 2);
  assert.deepEqual(await fs.readdir(storageDirectory), ['.gitkeep']);
});

test('clearStorageDirectory cria o diretório quando ele não existe', async (context) => {
  const parent = await createTempDirectory();
  context.after(() => fs.rm(parent, { recursive: true, force: true }));
  const storageDirectory = path.join(parent, 'storage');

  assert.equal(await clearStorageDirectory(storageDirectory), 0);
  assert.deepEqual(await fs.readdir(storageDirectory), []);
});

test('removeStoredFile e getFileLocation não saem do diretório de storage', async (context) => {
  const parent = await createTempDirectory();
  context.after(() => fs.rm(parent, { recursive: true, force: true }));
  const storageDirectory = path.join(parent, 'storage');
  await fs.mkdir(storageDirectory);
  await fs.writeFile(path.join(parent, 'outside.txt'), 'keep');

  const repository = createDocumentsRepository({ storageDirectory });
  await repository.removeStoredFile('../outside.txt');
  assert.equal(await fs.readFile(path.join(parent, 'outside.txt'), 'utf8'), 'keep');

  assert.deepEqual(repository.getFileLocation({ storedName: '../../etc/passwd' }), {
    root: storageDirectory,
    fileName: 'passwd',
  });
});

test('usageByOwner soma quantidade e bytes somente do proprietário', () => {
  const repository = createDocumentsRepository({ storageDirectory: '/tmp/unused' });
  repository.create({ id: '1', owner: 'a', size: 10, uploadedAt: '2026-01-01T00:00:00.000Z' });
  repository.create({ id: '2', owner: 'a', size: 5, uploadedAt: '2026-01-02T00:00:00.000Z' });
  repository.create({ id: '3', owner: 'b', size: 7, uploadedAt: '2026-01-03T00:00:00.000Z' });

  assert.deepEqual(repository.usageByOwner('a'), { count: 2, bytes: 15 });
  assert.deepEqual(repository.usageByOwner('c'), { count: 0, bytes: 0 });
});
