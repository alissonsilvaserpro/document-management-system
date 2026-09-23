const documentService = require('../services/documentService');

function getUserId(request) {
  return request.get('X-User-Id');
}

async function uploadDocument(request, response, next) {
  try {
    const document = await documentService.createDocument(
      request.file,
      getUserId(request),
    );
    response.status(201).json(document);
  } catch (error) {
    next(error);
  }
}

function listDocuments(request, response, next) {
  try {
    const documents = documentService.listDocuments(getUserId(request));
    response.json({ documents });
  } catch (error) {
    next(error);
  }
}

function downloadDocument(request, response, next) {
  try {
    const document = documentService.getDocumentForDownload(
      request.params.id,
      getUserId(request),
    );

    response.type(document.mimeType);
    response.download(document.storagePath, document.originalName, (error) => {
      if (error && !response.headersSent) {
        next(error);
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  downloadDocument,
  listDocuments,
  uploadDocument,
};