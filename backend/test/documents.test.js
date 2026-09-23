const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDirectory;

const app = require('../src/app');

let baseUrl;
let documentId;
let server;

before(async () => {
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  const form = new FormData();
  form.append('file', new Blob(['conteúdo para download'], {
    type: 'text/plain',
  }), 'documento.txt');

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: form,
  });
  assert.equal(response.status, 201, 'a fixture de documento deve ser criada');
  const document = await response.json();
  documentId = document.id;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.promises.rm(storageDirectory, { recursive: true, force: true });
});

test('POST /upload armazena e retorna os metadados do documento', async () => {
  const form = new FormData();
  form.append('file', new Blob(['novo conteúdo'], {
    type: 'text/plain',
  }), 'novo-documento.txt');

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-123' },
    body: form,
  });
  const document = await response.json();

  assert.equal(response.status, 201);
  assert.equal(document.originalName, 'novo-documento.txt');
  assert.equal(document.owner, 'user-123');
  assert.equal('storagePath' in document, false);
});

test('GET /documents lista os documentos do usuário', async () => {
  const response = await fetch(`${baseUrl}/documents`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(body.documents.some((document) => document.id === documentId));
});

test('GET /documents/:id/download retorna o conteúdo original', async () => {
  const response = await fetch(`${baseUrl}/documents/${documentId}/download`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-disposition'), /documento\.txt/);
  assert.equal(await response.text(), 'conteúdo para download');
});