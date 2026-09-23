const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'anonymous';
const MAX_USER_ID_LENGTH = 128;

function getOwner(userId) {
  const normalizedUserId = String(userId || '').trim().slice(0, MAX_USER_ID_LENGTH);
  return normalizedUserId || DEFAULT_USER_ID;
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

async function createDocument(file, userId) {
  if (!file) {
    const error = new Error('Envie um arquivo para continuar.');
    error.status = 400;
    error.code = 'FILE_REQUIRED';
    throw error;
  }

  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    storedName: file.filename,
    storagePath: file.path,
    size: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date().toISOString(),
    owner: getOwner(userId),
  };

  try {
    documentRepository.save(document);
    return toPublicDocument(document);
  } catch (error) {
    await documentRepository.removeFile(file.path);
    throw error;
  }
}

function listDocuments(userId) {
  return documentRepository
    .findByOwner(getOwner(userId))
    .map(toPublicDocument);
}

function getDocumentForDownload(id, userId) {
  if (!id || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    const error = new Error('Identificador de documento inválido.');
    error.status = 400;
    error.code = 'INVALID_DOCUMENT_ID';
    throw error;
  }

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