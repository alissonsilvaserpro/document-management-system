const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/documentController');

const storageDirectory = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.resolve(__dirname, '../../storage');
fs.mkdirSync(storageDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => callback(null, storageDirectory),
    filename: (_request, _file, callback) => callback(null, randomUUID()),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/documents', documentController.listDocuments);
router.get('/documents/:id/download', documentController.downloadDocument);

module.exports = router;