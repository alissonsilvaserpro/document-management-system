// Mantém metadados em memória e configura o armazenamento local dos arquivos.

const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');

const defaultStorageDirectory = path.resolve(__dirname, '../../storage');
const storageDirectory = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : defaultStorageDirectory;

fs.mkdirSync(storageDirectory, { recursive: true });

const documents = new Map();

const uploadStorage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, storageDirectory);
  },
  filename: (_request, _file, callback) => {
    callback(null, randomUUID());
  },
});

function save(document) {
  documents.set(document.id, document);
  return document;
}

function findById(id) {
  return documents.get(id);
}

function findByOwner(owner) {
  return Array.from(documents.values()).filter(
    (document) => document.owner === owner,
  );
}

async function removeFile(storagePath) {
  await fs.promises.rm(storagePath, { force: true });
}

module.exports = {
  findById,
  findByOwner,
  removeFile,
  save,
  uploadStorage,
};