import { useCallback, useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments } from './services/documentsApi.js';

const DEFAULT_USER_ID = 'usuario-demo';

export default function App() {
  const [userId, setUserId] = useState(DEFAULT_USER_ID);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const trimmedUserId = userId.trim();

  const loadDocuments = useCallback(async () => {
    if (!trimmedUserId) {
      setDocuments([]);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      setDocuments(await listDocuments(trimmedUserId));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, [trimmedUserId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Document Management System</h1>

      <label>
        Usuário:{' '}
        <input value={userId} onChange={(event) => setUserId(event.target.value)} maxLength={128} />
      </label>

      {trimmedUserId ? (
        <>
          <UploadComponent userId={trimmedUserId} onUploaded={loadDocuments} />
          <DocumentList
            documents={documents}
            userId={trimmedUserId}
            isLoading={isLoading}
            error={error}
          />
        </>
      ) : (
        <p>Informe um usuário para gerenciar seus documentos.</p>
      )}
    </main>
  );
}
