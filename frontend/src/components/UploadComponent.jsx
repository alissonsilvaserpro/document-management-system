import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentService.js';

export default function UploadComponent({ onUploaded }) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const document = await uploadDocument(selectedFile);
      setSelectedFile(null);
      inputRef.current.value = '';
      onUploaded(document);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="upload-panel" onSubmit={handleSubmit}>
      <div className="upload-copy">
        <span className="section-label">Novo documento</span>
        <h2>Envie um arquivo</h2>
        <p>O arquivo será armazenado com segurança no servidor local.</p>
      </div>

      <label className="file-picker">
        <input
          ref={inputRef}
          type="file"
          onChange={(event) => {
            setSelectedFile(event.target.files[0] || null);
            setError('');
          }}
          disabled={isUploading}
        />
        <span className="file-picker-icon" aria-hidden="true">+</span>
        <span>
          <strong>{selectedFile ? selectedFile.name : 'Escolher arquivo'}</strong>
          <small>{selectedFile ? 'Pronto para enviar' : 'Selecione no seu dispositivo'}</small>
        </span>
      </label>

      {error && <p className="form-message error-message" role="alert">{error}</p>}

      <button className="primary-button" type="submit" disabled={isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar documento'}
      </button>
    </form>
  );
}