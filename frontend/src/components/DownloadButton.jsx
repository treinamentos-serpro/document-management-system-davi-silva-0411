import { useState } from 'react';
import { downloadDocument } from '../services/documentsApi.js';

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Revogar no mesmo tick pode cancelar o download em alguns navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function DownloadButton({ doc, userId }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleClick() {
    setIsDownloading(true);
    setError('');
    try {
      const blob = await downloadDocument(doc.id, userId);
      saveBlob(blob, doc.originalName);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      <button
        className="button button--secondary"
        type="button"
        onClick={handleClick}
        disabled={isDownloading}
        aria-label={`Baixar ${doc.originalName}`}
      >
        {isDownloading ? 'Baixando...' : 'Baixar'}
      </button>
      {error && (
        <span className="inline-error" role="alert">
          {error}
        </span>
      )}
    </>
  );
}
