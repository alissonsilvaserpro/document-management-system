import { useState } from 'react';
import { downloadDocument } from '../services/documentService.js';

export default function DownloadButton({ document }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setIsDownloading(true);
    setError('');

    try {
      await downloadDocument(document);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="download-action">
      <button
        className="download-button"
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        aria-label={`Baixar ${document.originalName}`}
      >
        <span aria-hidden="true">↓</span>
        {isDownloading ? 'Baixando...' : 'Baixar'}
      </button>
      {error && <small className="inline-error" role="alert">{error}</small>}
    </div>
  );
}