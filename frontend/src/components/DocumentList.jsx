import DownloadButton from './DownloadButton.jsx';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList({ documents, userId, isLoading, error }) {
  return (
    <section className="panel" aria-busy={isLoading}>
      <div className="panel__header">
        <h2 className="panel__title">Meus documentos</h2>
        {documents.length > 0 && (
          <span className="panel__count">
            {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
          </span>
        )}
      </div>
      {isLoading && <p className="message message--muted">Carregando documentos...</p>}
      {error && (
        <p className="message message--error" role="alert">
          {error}
        </p>
      )}
      {!isLoading && !error && documents.length === 0 && (
        <p className="message message--muted">
          Nenhum documento enviado. Use o formulário acima para enviar o primeiro.
        </p>
      )}
      {documents.length > 0 && (
        <div className="table-wrapper">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tamanho</th>
                <th>Enviado em</th>
                <th className="doc-table__actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="doc-table__name">{doc.originalName}</td>
                  <td className="doc-table__meta">{formatSize(doc.size)}</td>
                  <td className="doc-table__meta">
                    {new Date(doc.uploadedAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="doc-table__actions">
                    <DownloadButton document={doc} userId={userId} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
