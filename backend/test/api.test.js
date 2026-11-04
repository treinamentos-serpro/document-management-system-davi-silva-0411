const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { startServer, upload, get } = require('./helpers');

test('health responde em /health e em /api/health com headers de segurança', async (context) => {
  const { baseUrl } = await startServer(context);
  const rootUrl = baseUrl.replace(/\/api$/, '');

  for (const url of [`${rootUrl}/health`, `${baseUrl}/health`]) {
    const response = await fetch(url);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('x-powered-by'), null);
  }
});

test('rotas de documentos ficam somente sob o prefixo /api', async (context) => {
  const { baseUrl } = await startServer(context);
  const response = await get(`${baseUrl.replace(/\/api$/, '')}/documents`);
  assert.equal(response.status, 404);
});

test('rejeita X-User-Id ausente ou com formato inválido sem gravar arquivo', async (context) => {
  const { baseUrl, storageDirectory } = await startServer(context);

  for (const userId of [undefined, '   ', 'a'.repeat(129), '../admin', 'user a', 'user;drop']) {
    const response = await upload(baseUrl, { userId });
    assert.equal(response.status, 400, `userId=${userId}`);
    assert.equal((await response.json()).error.code, 'INVALID_USER');
  }
  assert.deepEqual(await fs.readdir(storageDirectory), []);
});

test('faz upload, lista e baixa documentos somente para o proprietário', async (context) => {
  const { baseUrl, storageDirectory } = await startServer(context);

  const uploadResponse = await upload(baseUrl, { userId: 'user.a@example.com' });
  assert.equal(uploadResponse.status, 201);
  const document = await uploadResponse.json();
  assert.equal(document.originalName, 'sample.txt');
  assert.equal(document.size, 16);
  assert.equal(document.owner, 'user.a@example.com');
  assert.deepEqual(Object.keys(document).sort(), ['id', 'originalName', 'owner', 'size', 'uploadedAt']);

  // O id do documento é o mesmo nome do arquivo em disco.
  assert.deepEqual(await fs.readdir(storageDirectory), [document.id]);

  assert.deepEqual(await (await get(`${baseUrl}/documents`, 'user.a@example.com')).json(), [document]);
  assert.deepEqual(await (await get(`${baseUrl}/documents`, 'user-b')).json(), []);

  const otherOwnerDownload = await get(`${baseUrl}/documents/${document.id}/download`, 'user-b');
  assert.equal(otherOwnerDownload.status, 404);
  assert.equal((await otherOwnerDownload.json()).error.code, 'DOCUMENT_NOT_FOUND');

  const downloadResponse = await get(`${baseUrl}/documents/${document.id}/download`, 'user.a@example.com');
  assert.equal(downloadResponse.status, 200);
  assert.equal(await downloadResponse.text(), 'document content');
});

test('lista documentos do mais recente para o mais antigo', async (context) => {
  const { baseUrl } = await startServer(context);
  const first = await (await upload(baseUrl, { fileName: 'first.txt' })).json();
  await new Promise((resolve) => setTimeout(resolve, 5));
  const second = await (await upload(baseUrl, { fileName: 'second.txt' })).json();

  const list = await (await get(`${baseUrl}/documents`)).json();
  assert.deepEqual(list.map((document) => document.id), [second.id, first.id]);
});

test('download força octet-stream, nosniff e no-store mesmo para arquivos .html', async (context) => {
  const { baseUrl } = await startServer(context);
  const document = await (await upload(baseUrl, { content: '<script>alert(1)</script>', fileName: 'page.html' })).json();

  const response = await get(`${baseUrl}/documents/${document.id}/download`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/octet-stream');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.match(response.headers.get('content-disposition'), /^attachment; filename="page\.html"/);
});

test('nomes com path traversal são reduzidos ao nome base e não afetam o armazenamento', async (context) => {
  const { baseUrl, storageDirectory } = await startServer(context);
  const cases = [
    ['../../etc/passwd', 'passwd'],
    ['..\\..\\windows\\win.ini', 'win.ini'],
    ['/var/www/../../shell.php', 'shell.php'],
  ];

  for (const [fileName, expectedName] of cases) {
    const response = await upload(baseUrl, { fileName });
    assert.equal(response.status, 201, fileName);
    const document = await response.json();
    assert.equal(document.originalName, expectedName);
  }

  // Um nome que se reduz a vazio é descartado pelo parser: a requisição fica sem arquivo.
  const dotDot = await upload(baseUrl, { fileName: '..' });
  assert.equal(dotDot.status, 400);
  assert.equal((await dotDot.json()).error.code, 'FILE_REQUIRED');

  const storedFiles = await fs.readdir(storageDirectory);
  assert.equal(storedFiles.length, cases.length);
  for (const storedFile of storedFiles) {
    assert.match(storedFile, /^[0-9a-f-]{36}$/);
  }
});

test('preserva nomes de arquivo UTF-8', async (context) => {
  const { baseUrl } = await startServer(context);
  const document = await (await upload(baseUrl, { fileName: 'relatório-ação.pdf' })).json();
  assert.equal(document.originalName, 'relatório-ação.pdf');
});

test('valida o id do documento no download', async (context) => {
  const { baseUrl } = await startServer(context);

  for (const id of ['not-a-uuid', '..%2F..%2Fetc%2Fpasswd']) {
    const response = await get(`${baseUrl}/documents/${id}/download`);
    assert.equal(response.status, 400, id);
    assert.equal((await response.json()).error.code, 'INVALID_DOCUMENT_ID');
  }

  const unknown = await get(`${baseUrl}/documents/00000000-0000-4000-8000-000000000000/download`);
  assert.equal(unknown.status, 404);
});

test('retorna FILE_NOT_FOUND quando o arquivo some do disco', async (context) => {
  const { baseUrl, storageDirectory } = await startServer(context);
  const document = await (await upload(baseUrl)).json();
  await fs.rm(path.join(storageDirectory, document.id));

  const response = await get(`${baseUrl}/documents/${document.id}/download`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'FILE_NOT_FOUND');
});

test('exige o campo file e rejeita uploads com arquivos ou campos extras', async (context) => {
  const { baseUrl, storageDirectory } = await startServer(context);

  const empty = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-a' },
    body: new FormData(),
  });
  assert.equal(empty.status, 400);
  assert.equal((await empty.json()).error.code, 'FILE_REQUIRED');

  const twoFiles = new FormData();
  twoFiles.append('file', new Blob(['a']), 'a.txt');
  twoFiles.append('file', new Blob(['b']), 'b.txt');
  const withExtraField = new FormData();
  withExtraField.append('note', 'x');
  withExtraField.append('file', new Blob(['a']), 'a.txt');

  for (const body of [twoFiles, withExtraField]) {
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'user-a' },
      body,
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'INVALID_UPLOAD');
  }
  assert.deepEqual(await fs.readdir(storageDirectory), []);
});

test('rejeita arquivos acima do limite com 413', async (context) => {
  const { baseUrl, storageDirectory } = await startServer(context, { maxFileSizeBytes: 32 });
  const response = await upload(baseUrl, { content: 'x'.repeat(33) });
  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, 'FILE_TOO_LARGE');
  assert.deepEqual(await fs.readdir(storageDirectory), []);
});

test('aplica cota de quantidade de arquivos por usuário e remove o arquivo rejeitado', async (context) => {
  const { baseUrl, storageDirectory } = await startServer(context, { maxFilesPerUser: 2 });
  assert.equal((await upload(baseUrl)).status, 201);
  assert.equal((await upload(baseUrl)).status, 201);

  const rejected = await upload(baseUrl);
  assert.equal(rejected.status, 413);
  assert.equal((await rejected.json()).error.code, 'QUOTA_EXCEEDED');
  assert.equal((await fs.readdir(storageDirectory)).length, 2);

  assert.equal((await upload(baseUrl, { userId: 'user-b' })).status, 201);
});

test('aplica cota de bytes por usuário', async (context) => {
  const { baseUrl, storageDirectory } = await startServer(context, { maxBytesPerUser: 20 });
  assert.equal((await upload(baseUrl, { content: 'x'.repeat(15) })).status, 201);

  const rejected = await upload(baseUrl, { content: 'x'.repeat(6) });
  assert.equal(rejected.status, 413);
  assert.equal((await rejected.json()).error.code, 'QUOTA_EXCEEDED');
  assert.equal((await fs.readdir(storageDirectory)).length, 1);

  assert.equal((await upload(baseUrl, { content: 'x'.repeat(5) })).status, 201);
});
