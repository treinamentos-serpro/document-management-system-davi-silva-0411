const { loadConfig } = require('./config');
const { createApp } = require('./app');
const { clearStorageDirectory } = require('./repositories/documents.repository');

async function start() {
  const config = loadConfig();
  const removed = await clearStorageDirectory(config.storageDirectory);
  if (removed > 0) {
    console.log(`${removed} arquivo(s) órfão(s) removido(s) de ${config.storageDirectory}`);
  }

  createApp(config).listen(config.port, () => {
    console.log(`DMS backend ouvindo na porta ${config.port}`);
  });
}

start().catch((error) => {
  console.error('Falha ao iniciar o backend:', error);
  process.exit(1);
});
