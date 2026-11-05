const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadConfig, DEFAULTS } = require('../src/config');

test('loadConfig usa valores padrão quando não há variáveis de ambiente', () => {
  assert.deepEqual(loadConfig({}), DEFAULTS);
});

test('loadConfig lê variáveis de ambiente válidas', () => {
  const config = loadConfig({
    PORT: '4000',
    STORAGE_DIR: 'tmp/storage',
    MAX_FILE_SIZE_BYTES: '1024',
    MAX_FILES_PER_USER: '5',
    MAX_BYTES_PER_USER: '2048',
  });
  assert.deepEqual(config, {
    port: 4000,
    storageDirectory: path.resolve('tmp/storage'),
    maxFileSizeBytes: 1024,
    maxFilesPerUser: 5,
    maxBytesPerUser: 2048,
  });
});

test('loadConfig ignora valores inválidos', () => {
  const config = loadConfig({ PORT: 'abc', MAX_FILE_SIZE_BYTES: '-1', MAX_FILES_PER_USER: '1.5', MAX_BYTES_PER_USER: '0' });
  assert.deepEqual(config, DEFAULTS);
});
