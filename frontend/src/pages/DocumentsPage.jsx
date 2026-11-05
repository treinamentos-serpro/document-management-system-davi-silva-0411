import { useEffect, useState } from 'react';
import UploadComponent from '../components/UploadComponent.jsx';
import DocumentList from '../components/DocumentList.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { isAbortError, listDocuments } from '../services/documentsApi.js';

const USER_INPUT_DEBOUNCE_MS = 300;

export default function DocumentsPage({ userId }) {
  const activeUserId = useDebouncedValue(userId, USER_INPUT_DEBOUNCE_MS);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const isUserPending = userId !== activeUserId;

  // Nunca exibe a lista de um usuário enquanto outro está informado no campo.
  useEffect(() => {
    setDocuments([]);
    setError('');
  }, [userId]);

  useEffect(() => {
    if (!activeUserId) return undefined;

    const controller = new AbortController();
    setIsLoading(true);
    setError('');

    listDocuments(activeUserId, { signal: controller.signal })
      .then(setDocuments)
      .catch((loadError) => {
        if (!isAbortError(loadError)) setError(loadError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [activeUserId, reloadKey]);

  if (!userId) {
    return (
      <p className="panel message message--muted">
        Informe um usuário para gerenciar seus documentos.
      </p>
    );
  }

  return (
    <>
      <UploadComponent
        userId={activeUserId}
        disabled={isUserPending}
        onUploaded={() => setReloadKey((key) => key + 1)}
      />
      <DocumentList
        documents={documents}
        userId={activeUserId}
        isLoading={isLoading || isUserPending}
        error={error}
      />
    </>
  );
}
