const API_PREFIX = '/api';

export function isAbortError(error) {
  return error?.name === 'AbortError';
}

async function request(path, { userId, ...options } = {}) {
  const headers = { ...options.headers };
  if (userId) {
    headers['X-User-Id'] = userId;
  }

  let response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, { ...options, headers });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new Error('Não foi possível conectar ao servidor.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || `Erro na requisição (${response.status}).`);
  }

  return response;
}

export async function listDocuments(userId, { signal } = {}) {
  const response = await request('/documents', { userId, signal });
  return response.json();
}

export async function uploadDocument(file, userId) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await request('/upload', { userId, method: 'POST', body: formData });
  return response.json();
}

export async function downloadDocument(id, userId) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`, { userId });
  return response.blob();
}
