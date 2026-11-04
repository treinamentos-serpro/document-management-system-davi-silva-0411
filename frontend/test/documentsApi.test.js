import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  downloadDocument,
  isAbortError,
  listDocuments,
  uploadDocument,
} from '../src/services/documentsApi.js';

const originalFetch = globalThis.fetch;
let calls;

function mockFetch(handler) {
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return handler(url, options);
  };
}

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('listDocuments usa o prefixo /api, envia X-User-Id e repassa o signal', async () => {
  mockFetch(() => Response.json([{ id: '1' }]));
  const controller = new AbortController();

  assert.deepEqual(await listDocuments('user-a', { signal: controller.signal }), [{ id: '1' }]);
  assert.equal(calls[0].url, '/api/documents');
  assert.equal(calls[0].options.headers['X-User-Id'], 'user-a');
  assert.equal(calls[0].options.signal, controller.signal);
});

test('não envia X-User-Id quando o usuário está vazio', async () => {
  mockFetch(() => Response.json([]));
  await listDocuments('');
  assert.equal('X-User-Id' in calls[0].options.headers, false);
});

test('uploadDocument envia FormData no campo file sem definir Content-Type', async () => {
  mockFetch(() => Response.json({ id: '1' }, { status: 201 }));
  const file = new File(['abc'], 'a.txt');

  await uploadDocument(file, 'user-a');
  assert.equal(calls[0].url, '/api/upload');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.body.get('file').name, 'a.txt');
  assert.equal('Content-Type' in calls[0].options.headers, false);
});

test('downloadDocument codifica o id na URL', async () => {
  mockFetch(() => new Response('conteudo'));
  const blob = await downloadDocument('../x', 'user-a');
  assert.equal(calls[0].url, '/api/documents/..%2Fx/download');
  assert.equal(await blob.text(), 'conteudo');
});

test('usa a mensagem de erro do backend ou uma mensagem genérica', async () => {
  mockFetch(() => Response.json({ error: { message: 'Documento não encontrado.' } }, { status: 404 }));
  await assert.rejects(downloadDocument('1', 'user-a'), { message: 'Documento não encontrado.' });

  mockFetch(() => new Response('falha', { status: 502 }));
  await assert.rejects(listDocuments('user-a'), { message: 'Erro na requisição (502).' });
});

test('converte falhas de rede em mensagem amigável, mas preserva AbortError', async () => {
  mockFetch(() => {
    throw new TypeError('fetch failed');
  });
  await assert.rejects(listDocuments('user-a'), { message: 'Não foi possível conectar ao servidor.' });

  mockFetch(() => {
    throw new DOMException('aborted', 'AbortError');
  });
  await assert.rejects(listDocuments('user-a'), (error) => isAbortError(error));
});
