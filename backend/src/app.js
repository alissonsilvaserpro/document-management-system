// Configura e inicia a aplicação Express, suas rotas e o tratamento de erros.

const express = require('express');
const multer = require('multer');
const documentRoutes = require('./routes/documentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint de verificação de saúde. As demais rotas (/upload, /documents,
// /documents/:id/download) serão implementadas durante o Passo 2.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(documentRoutes);

app.use((error, _request, response, _next) => {
  const isMulterError = error instanceof multer.MulterError;
  const isFileTooLarge = isMulterError && error.code === 'LIMIT_FILE_SIZE';
  const status = isFileTooLarge ? 413 : (isMulterError ? 400 : (error.status || 500));
  const code = isFileTooLarge ? 'FILE_TOO_LARGE' : (error.code || 'INTERNAL_ERROR');
  const message = status === 500
    ? 'Não foi possível processar a solicitação.'
    : error.message;

  response.status(status).json({ error: { code, message } });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
