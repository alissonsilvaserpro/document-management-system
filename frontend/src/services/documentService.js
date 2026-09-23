const API_PREFIX = '/api';

async function getErrorMessage(response) {
  try {
    const body = await response.json();
    return body.error?.message || 'Não foi possível concluir a operação.';
  } catch {
    return 'Não foi possível se comunicar com o servidor.';
  }
}

async function request(url, options) {
  let response;

  try {
    response = await fetch(`${API_PREFIX}${url}`, options);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }

    throw new Error('Não foi possível se comunicar com o servidor.');
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

export async function listDocuments({ signal } = {}) {
  const response = await request('/documents', { signal });
  const body = await response.json();
  return body.documents;
}

export async function downloadDocument(document) {
  const response = await request(`/documents/${document.id}/download`);
  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const link = window.document.createElement('a');

  link.href = downloadUrl;
  link.download = document.originalName;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
}