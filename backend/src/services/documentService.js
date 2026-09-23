const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');

function getOwner(userId) {
  return String(userId || process.env.DEFAULT_USER_ID || 'anonymous').trim();
}

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    mimeType: document.mimeType,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

function createDocument(file, userId) {
  if (!file) {
    const error = new Error('Envie um arquivo para continuar.');
    error.status = 400;
    error.code = 'FILE_REQUIRED';
    throw error;
  }

  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    storagePath: file.path,
    size: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date().toISOString(),
    owner: getOwner(userId),
  };

  documentRepository.save(document);
  return toPublicDocument(document);
}

function listDocuments(userId) {
  return documentRepository.findByOwner(getOwner(userId)).map(toPublicDocument);
}

function getDocumentForDownload(id, userId) {
  const document = documentRepository.findById(id);

  if (!document || document.owner !== getOwner(userId)) {
    const error = new Error('Documento não encontrado.');
    error.status = 404;
    error.code = 'DOCUMENT_NOT_FOUND';
    throw error;
  }

  return document;
}

module.exports = {
  createDocument,
  getDocumentForDownload,
  listDocuments,
};