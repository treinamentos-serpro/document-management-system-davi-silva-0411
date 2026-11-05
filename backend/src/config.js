const path = require('node:path');

const DEFAULTS = {
  port: 3000,
  storageDirectory: path.resolve(__dirname, '../storage'),
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxFilesPerUser: 100,
  maxBytesPerUser: 100 * 1024 * 1024,
};

function readPositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function loadConfig(env = process.env) {
  return {
    port: readPositiveInteger(env.PORT, DEFAULTS.port),
    storageDirectory: env.STORAGE_DIR ? path.resolve(env.STORAGE_DIR) : DEFAULTS.storageDirectory,
    maxFileSizeBytes: readPositiveInteger(env.MAX_FILE_SIZE_BYTES, DEFAULTS.maxFileSizeBytes),
    maxFilesPerUser: readPositiveInteger(env.MAX_FILES_PER_USER, DEFAULTS.maxFilesPerUser),
    maxBytesPerUser: readPositiveInteger(env.MAX_BYTES_PER_USER, DEFAULTS.maxBytesPerUser),
  };
}

module.exports = { loadConfig, DEFAULTS };
