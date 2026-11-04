import DownloadButton from './DownloadButton.jsx';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList({ documents, userId, isLoading, error }) {
  return (
    <section>
      <h2>Meus documentos</h2>
      {isLoading && <p>Carregando documentos...</p>}
      {error && <p role="alert">{error}</p>}
      {!isLoading && !error && documents.length === 0 && <p>Nenhum documento enviado.</p>}
      {documents.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tamanho</th>
              <th>Enviado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.originalName}</td>
                <td>{formatSize(doc.size)}</td>
                <td>{new Date(doc.uploadedAt).toLocaleString('pt-BR')}</td>
                <td>
                  <DownloadButton document={doc} userId={userId} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
