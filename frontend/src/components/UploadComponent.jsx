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
    <form className="panel upload-form" onSubmit={handleSubmit}>
      <h2 className="panel__title">Enviar documento</h2>
      <div className="upload-form__row">
        <input
          className="file-input"
          aria-label="Arquivo para enviar"
          ref={inputRef}
          type="file"
          onChange={(event) => setFile(event.target.files[0] ?? null)}
          disabled={isUploading}
        />
        <button className="button button--primary" type="submit" disabled={isUploading || !file}>
          {isUploading ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
      {error && (
        <p className="message message--error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
