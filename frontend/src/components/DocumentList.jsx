import DownloadButton from './DownloadButton.jsx';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList({ documents, isLoading, error, onRetry }) {
  if (isLoading) {
    return <p className="list-state" aria-live="polite">Carregando documentos...</p>;
  }

  if (error) {
    return (
      <div className="list-state error-state" role="alert">
        <p>{error}</p>
        <button className="text-button" type="button" onClick={onRetry}>Tentar novamente</button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="list-state empty-state">
        <strong>Nenhum documento por aqui</strong>
        <p>Envie o primeiro arquivo para começar sua biblioteca.</p>
      </div>
    );
  }

  return (
    <ul className="document-list">
      {documents.map((document) => (
        <li className="document-card" key={document.id}>
          <div className="document-mark" aria-hidden="true">
            {document.originalName.slice(0, 1).toUpperCase()}
          </div>
          <div className="document-details">
            <strong title={document.originalName}>{document.originalName}</strong>
            <span>
              {formatFileSize(document.size)} · {dateFormatter.format(new Date(document.uploadedAt))}
            </span>
          </div>
          <DownloadButton document={document} />
        </li>
      ))}
    </ul>
  );
}