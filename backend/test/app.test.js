const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const app = require('../src/app');

test('o app backend é exportado', () => {
  assert.equal(typeof app, 'function');
});

test('faz upload, lista e baixa documentos somente para o proprietário', async (context) => {
  const storageDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const testApp = app.createApp({ storageDirectory, maxFileSizeBytes: 32 });
  const server = testApp.listen(0);

  context.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.rm(storageDirectory, { recursive: true, force: true });
  });

  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const unauthorizedUpload = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: new FormData(),
  });
  assert.equal(unauthorizedUpload.status, 400);
  assert.equal((await unauthorizedUpload.json()).error.code, 'INVALID_USER');
  assert.deepEqual(await fs.readdir(storageDirectory), []);

  const formData = new FormData();
  formData.append('file', new Blob(['document content']), 'sample.txt');
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-a' },
    body: formData,
  });
  assert.equal(uploadResponse.status, 201);
  const document = await uploadResponse.json();
  assert.equal(document.originalName, 'sample.txt');
  assert.equal(document.size, 16);
  assert.equal(document.owner, 'user-a');
  assert.equal('filePath' in document, false);

  const ownerListResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'user-a' },
  });
  assert.deepEqual(await ownerListResponse.json(), [document]);

  const otherOwnerListResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'user-b' },
  });
  assert.deepEqual(await otherOwnerListResponse.json(), []);

  const unauthorizedDownload = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'user-b' },
  });
  assert.equal(unauthorizedDownload.status, 404);

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'user-a' },
  });
  assert.equal(downloadResponse.status, 200);
  assert.equal(await downloadResponse.text(), 'document content');

  const invalidIdResponse = await fetch(`${baseUrl}/documents/not-a-uuid/download`, {
    headers: { 'X-User-Id': 'user-a' },
  });
  assert.equal(invalidIdResponse.status, 400);

  const largeForm = new FormData();
  largeForm.append('file', new Blob(['x'.repeat(33)]), 'large.txt');
  const largeResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-a' },
    body: largeForm,
  });
  assert.equal(largeResponse.status, 413);
});
