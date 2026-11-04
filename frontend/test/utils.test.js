import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatSize } from '../src/utils/format.js';
import { MAX_FILE_SIZE_BYTES, validateFileSize } from '../src/utils/files.js';

test('formatSize formata bytes, KB e MB', () => {
  assert.equal(formatSize(512), '512 B');
  assert.equal(formatSize(1536), '1.5 KB');
  assert.equal(formatSize(5 * 1024 * 1024), '5.0 MB');
});

test('limite padrão do frontend acompanha o padrão do backend (10 MB)', () => {
  assert.equal(MAX_FILE_SIZE_BYTES, 10 * 1024 * 1024);
});

test('validateFileSize aceita arquivos no limite e rejeita acima dele', () => {
  assert.equal(validateFileSize({ size: 100 }, 100), '');
  assert.equal(validateFileSize({ size: 101 }, 100), 'O arquivo excede o tamanho máximo de 100 B.');
});
