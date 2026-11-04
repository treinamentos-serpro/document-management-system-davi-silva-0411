import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentsApi.js';

export default function UploadComponent({ userId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    setIsUploading(true);
    setError('');
    try {
      const document = await uploadDocument(file, userId);
      setFile(null);
      inputRef.current.value = '';
      onUploaded?.(document);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Enviar documento</h2>
      <input
        ref={inputRef}
        type="file"
        onChange={(event) => setFile(event.target.files[0] ?? null)}
        disabled={isUploading}
      />
      <button type="submit" disabled={isUploading || !file}>
        {isUploading ? 'Enviando...' : 'Enviar'}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
