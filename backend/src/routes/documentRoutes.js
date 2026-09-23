const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/documentController');
const documentRepository = require('../repositories/documentRepository');

const router = express.Router();
const configuredMaxFileSize = Number(process.env.MAX_FILE_SIZE_BYTES);
const maxFileSize = Number.isFinite(configuredMaxFileSize) && configuredMaxFileSize > 0
  ? configuredMaxFileSize
  : 10 * 1024 * 1024;
const upload = multer({
  storage: documentRepository.uploadStorage,
  limits: { fileSize: maxFileSize },
});

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/documents', documentController.listDocuments);
router.get('/documents/:id/download', documentController.downloadDocument);

module.exports = router;