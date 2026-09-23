import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments } from './services/documentService.js';
import './styles.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function loadDocuments(signal) {
    setIsLoading(true);
    setError('');

    try {
      setDocuments(await listDocuments({ signal }));
    } catch (loadError) {
      if (loadError.name !== 'AbortError') {
        setError(loadError.message);
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadDocuments(controller.signal);
    return () => controller.abort();
  }, []);

  function handleUploaded(document) {
    setDocuments((currentDocuments) => [document, ...currentDocuments]);
    setSuccessMessage(`${document.originalName} foi enviado com sucesso.`);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="Arquivo DMS - início">
          <span className="brand-mark">A</span>
          <span>Arquivo DMS</span>
        </a>
        <span className="storage-status"><i /> Armazenamento local</span>
      </header>

      <main>
        <section className="intro">
          <span className="section-label">Gestão de documentos</span>
          <h1>Seus arquivos,<br />bem organizados.</h1>
          <p>Envie, consulte e baixe documentos em um só lugar.</p>
        </section>

        <UploadComponent onUploaded={handleUploaded} />

        {successMessage && (
          <p className="success-message" role="status">
            {successMessage}
            <button type="button" onClick={() => setSuccessMessage('')} aria-label="Fechar mensagem">×</button>
          </p>
        )}

        <section className="library" aria-labelledby="documents-title">
          <div className="section-heading">
            <div>
              <span className="section-label">Biblioteca</span>
              <h2 id="documents-title">Seus documentos</h2>
            </div>
            {!isLoading && !error && <span className="document-count">{documents.length} arquivo(s)</span>}
          </div>

          <DocumentList
            documents={documents}
            isLoading={isLoading}
            error={error}
            onRetry={() => loadDocuments()}
          />
        </section>
      </main>
    </div>
  );
}
