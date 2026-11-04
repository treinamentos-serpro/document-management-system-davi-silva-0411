import { formatSize } from './format.js';

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function readMaxFileSize(value) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_FILE_SIZE_BYTES;
}

// Deve acompanhar MAX_FILE_SIZE_BYTES do backend; o backend continua sendo a validação final.
export const MAX_FILE_SIZE_BYTES = readMaxFileSize(import.meta.env?.VITE_MAX_FILE_SIZE_BYTES);

export function validateFileSize(file, maxBytes = MAX_FILE_SIZE_BYTES) {
  if (file.size > maxBytes) {
    return `O arquivo excede o tamanho máximo de ${formatSize(maxBytes)}.`;
  }
  return '';
}
