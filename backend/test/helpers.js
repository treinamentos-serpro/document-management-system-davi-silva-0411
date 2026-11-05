const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../src/app');

async function createTempDirectory() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
}

async function startServer(context, overrides = {}) {
  const storageDirectory = await createTempDirectory();
  const server = createApp({ storageDirectory, ...overrides }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  context.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await fs.rm(storageDirectory, { recursive: true, force: true });
  });

  return { baseUrl: `http://127.0.0.1:${server.address().port}/api`, storageDirectory };
}

function upload(baseUrl, options = {}) {
  const { content = 'document content', fileName = 'sample.txt' } = options;
  const userId = 'userId' in options ? options.userId : 'user-a';
  const formData = new FormData();
  formData.append('file', new Blob([content]), fileName);
  const headers = userId === undefined ? {} : { 'X-User-Id': userId };
  return fetch(`${baseUrl}/upload`, { method: 'POST', headers, body: formData });
}

function get(url, userId = 'user-a') {
  return fetch(url, { headers: userId === undefined ? {} : { 'X-User-Id': userId } });
}

module.exports = { createTempDirectory, startServer, upload, get };
