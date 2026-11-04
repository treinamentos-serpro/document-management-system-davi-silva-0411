import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentsApi.js';
import { validateFileSize } from '../utils/files.js';

export default function UploadComponent({ userId, disabled = false, onUploaded }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  function resetInput() {
    setFile(null);
    inputRef.current.value = '';
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files[0] ?? null;
    const sizeError = selectedFile ? validateFileSize(selectedFile) : '';
    setError(sizeError);
    if (sizeError) {
      resetInput();
      return;
    }
    setFile(selectedFile);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    setIsUploading(true);
    setError('');
    try {
      const uploadedDoc = await uploadDocument(file, userId);
      resetInput();
      onUploaded?.(uploadedDoc);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  const isBusy = isUploading || disabled;

  return (
    <form className="panel upload-form" onSubmit={handleSubmit}>
      <h2 className="panel__title">Enviar documento</h2>
      <div className="upload-form__row">
        <input
          className="file-input"
          aria-label="Arquivo para enviar"
          ref={inputRef}
          type="file"
          onChange={handleFileChange}
          disabled={isBusy}
        />
        <button className="button button--primary" type="submit" disabled={isBusy || !file}>
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
