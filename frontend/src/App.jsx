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
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <h1 className="app-title">
            <span className="app-title__mark" aria-hidden="true">
              ▤{' '}
            </span>
            Document Management System
          </h1>
          <label className="user-field">
            Usuário
            <input
              className="input"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              maxLength={128}
            />
          </label>
        </div>
      </header>

      <main className="app-main">
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
          <p className="panel message message--muted">
            Informe um usuário para gerenciar seus documentos.
          </p>
        )}
      </main>
    </>
  );
}
