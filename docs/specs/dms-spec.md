# Especificação: Document Management System

## 1. Objetivo

Disponibilizar uma aplicação web para que usuários enviem, consultem e baixem seus documentos armazenados localmente, com metadados mantidos em memória.

## 2. Escopo

### Dentro do escopo

- Upload de documentos via interface web.
- Armazenamento local dos arquivos em `backend/storage`.
- Listagem de documentos do usuário atual.
- Download de documentos pelo identificador.
- Identificação simples do usuário por `X-User-Id`.
- Validação básica de arquivos e respostas HTTP.
- Frontend React integrado ao backend por `fetch`.
- Testes automatizados dos principais contratos da API.

### Fora do escopo

- Autenticação e autorização completas.
- Cadastro persistente de usuários.
- Armazenamento em nuvem ou serviços externos.
- Versionamento de documentos.
- Edição, exclusão ou compartilhamento de documentos.
- Banco de dados.
- Busca avançada e categorização.
- Persistência dos metadados após reinício do processo.

## 3. Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-01 | O usuário pode enviar um documento usando `multipart/form-data`. |
| RF-02 | O sistema deve armazenar o arquivo no filesystem local usando `multer` com `diskStorage`. |
| RF-03 | O sistema deve gerar um identificador único para cada documento. |
| RF-04 | O sistema deve registrar nome original, tamanho, data de upload e proprietário. |
| RF-05 | O usuário pode listar os documentos associados ao seu identificador. |
| RF-06 | O usuário pode baixar um documento pelo identificador. |
| RF-07 | O sistema deve impedir o download de documento pertencente a outro usuário. |
| RF-08 | O frontend deve informar estados de carregamento, sucesso e erro. |
| RF-09 | O sistema deve rejeitar requisições sem arquivo, com arquivo inválido ou acima do limite configurado. |
| RF-10 | O sistema deve preservar o endpoint `GET /health` para verificação de disponibilidade. |

## 4. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-01 | O backend deve usar Node.js, Express e CommonJS. |
| RNF-02 | O frontend deve usar React, Vite e módulos ESM. |
| RNF-03 | A comunicação do frontend deve usar o prefixo `/api`. |
| RNF-04 | Os arquivos devem ser gravados exclusivamente em `backend/storage`. |
| RNF-05 | O upload deve usar `multer.diskStorage`. |
| RNF-06 | Os metadados devem ser mantidos em memória nesta fase. |
| RNF-07 | A configuração deve usar variáveis de ambiente sempre que aplicável. |
| RNF-08 | As camadas devem seguir `routes -> controllers -> services -> repositories`. |
| RNF-09 | Nenhuma camada interna deve depender diretamente do Express ou do React. |
| RNF-10 | Nomes de símbolos devem estar em inglês e mensagens ao usuário em português. |
| RNF-11 | O sistema não deve confiar em caminhos ou nomes de arquivo enviados pelo cliente. |
| RNF-12 | Erros devem retornar respostas JSON consistentes nos endpoints de controle. |

### Configurações

- `PORT`: porta do backend. Padrão: `3000`.
- `MAX_FILE_SIZE_BYTES`: tamanho máximo do arquivo. Padrão sugerido: `10 MB`.
- `STORAGE_DIR`: diretório de armazenamento. Padrão: `backend/storage`.
- `DEFAULT_USER_ID`: identificador usado quando `X-User-Id` não for informado. Padrão: `anonymous`.

## 5. Modelo de dados

### Documento

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `id` | string | Sim | Identificador único público do documento. |
| `originalName` | string | Sim | Nome original enviado pelo usuário. |
| `storedName` | string | Sim | Nome interno gerado pelo sistema. |
| `storagePath` | string | Sim | Caminho interno usado pelo repositório. Não deve ser exposto na API. |
| `size` | number | Sim | Tamanho do arquivo em bytes. |
| `mimeType` | string | Sim | Tipo MIME informado pelo upload. |
| `uploadedAt` | string | Sim | Data e hora do upload em ISO 8601. |
| `owner` | string | Sim | Identificador do usuário proprietário. |

### Persistência

- Os metadados serão armazenados em uma coleção em memória, como `Map<string, Document>`.
- O arquivo físico será armazenado em `backend/storage`.
- O nome físico deve ser gerado pelo servidor, preferencialmente com UUID.
- O `originalName` deve ser usado apenas como metadado e nunca como caminho físico.
- Após reinício do backend, os metadados serão perdidos.
- O sistema deve documentar que arquivos órfãos podem permanecer no diretório após reinício ou falha entre o upload físico e o registro do metadado.

## 6. Identificação do usuário

- O cliente pode enviar o cabeçalho `X-User-Id`.
- Quando ausente, o backend usa `DEFAULT_USER_ID`.
- O valor deve ser normalizado e limitado a um tamanho razoável.
- A listagem retorna somente documentos cujo `owner` corresponde ao usuário atual.
- O download deve validar a propriedade antes de enviar o arquivo.
- Essa identificação não representa autenticação real e não deve ser considerada mecanismo de segurança em produção.

## 7. Contratos de API

### `GET /health`

Resposta `200`:

```json
{
  "status": "ok"
}
```

### `POST /upload`

Entrada:

- Content-Type: `multipart/form-data`
- Campo obrigatório: `file`
- Cabeçalho opcional: `X-User-Id`

Resposta `201`:

```json
{
  "id": "document-id",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "mimeType": "application/pdf",
  "uploadedAt": "2026-09-23T12:00:00.000Z",
  "owner": "user-123"
}
```

O campo `storagePath` ou qualquer caminho físico não deve ser retornado.

Erros esperados:

- `400` quando nenhum arquivo for enviado.
- `400` quando o arquivo exceder o limite ou for inválido.
- `413` quando o limite de tamanho for excedido, caso essa distinção seja implementada.
- `500` para falha inesperada de armazenamento.

Formato de erro:

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "Envie um arquivo para continuar."
  }
}
```

### `GET /documents`

Cabeçalho opcional:

- `X-User-Id`

Resposta `200`:

```json
{
  "documents": [
    {
      "id": "document-id",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "mimeType": "application/pdf",
      "uploadedAt": "2026-09-23T12:00:00.000Z",
      "owner": "user-123"
    }
  ]
}
```

A lista deve retornar apenas os documentos do usuário atual.

### `GET /documents/:id/download`

Cabeçalho opcional:

- `X-User-Id`

Comportamento:

- `200`: retorna o conteúdo binário do arquivo.
- Define `Content-Disposition` com o nome original do documento.
- Define `Content-Type` conforme o MIME registrado.
- `400`: identificador inválido.
- `404`: documento inexistente ou não pertencente ao usuário.
- `500`: falha na leitura do arquivo.

O endpoint não deve permitir traversal de diretórios nem aceitar caminho físico enviado pelo cliente.

## 8. Arquitetura

### Backend

Estrutura obrigatória:

- `routes/`: registra endpoints e encaminha requisições.
- `controllers/`: lê parâmetros HTTP, cabeçalhos, arquivos e monta respostas.
- `services/`: aplica regras de negócio, ownership e validações.
- `repositories/`: gerencia arquivos locais e metadados em memória.

Fluxo:

```text
routes -> controllers -> services -> repositories
```

Responsabilidades principais:

- `DocumentRepository`: criar, listar, buscar metadados e obter o arquivo.
- `DocumentService`: validar operações, associar proprietário e impedir acesso indevido.
- `UploadController`: processar upload e resposta HTTP.
- `DocumentController`: listar documentos e realizar download.
- `upload route`: configurar o middleware `multer` com `diskStorage`.

### Frontend

Componentes previstos:

- `UploadComponent`: seleção e envio de arquivo.
- `DocumentList`: carregamento e exibição dos documentos.
- `DownloadButton`: acionamento do download.
- `services/documentService`: chamadas HTTP usando `fetch`.
- `pages/`: composição da tela principal.

O frontend deve consumir:

- `/api/upload`
- `/api/documents`
- `/api/documents/:id/download`

## 9. Plano de execução

### Etapa 1: Fundação e configuração

Arquivos:

- `backend/src/app.js`
- `backend/src/config/`
- `backend/storage/`
- `backend/.env.example`

Atividades:

- Configurar Express e middleware de erros.
- Centralizar variáveis de ambiente.
- Garantir criação ou validação do diretório de armazenamento.
- Preservar `GET /health`.

Critérios de aceite:

- O backend inicia com configuração padrão.
- `GET /health` retorna `200`.
- O diretório local de armazenamento é utilizado.

### Etapa 2: Repositórios

Arquivos:

- `backend/src/repositories/documentRepository.js`
- `backend/src/repositories/fileStorageRepository.js`

Atividades:

- Implementar coleção de metadados em memória.
- Implementar gravação e leitura de arquivos locais.
- Gerar nomes físicos independentes do nome original.

Critérios de aceite:

- Um documento pode ser salvo, consultado e listado.
- O arquivo é criado em `backend/storage`.
- O caminho físico não é exposto no modelo público.

### Etapa 3: Serviços de negócio

Arquivos:

- `backend/src/services/documentService.js`

Atividades:

- Validar arquivo e usuário.
- Associar o documento ao proprietário.
- Filtrar listagem por usuário.
- Validar propriedade durante o download.

Critérios de aceite:

- Usuários não acessam documentos de outros usuários.
- Documento inexistente retorna erro de recurso não encontrado.
- Metadados públicos não contêm informações internas de armazenamento.

### Etapa 4: Controllers e rotas

Arquivos:

- `backend/src/controllers/uploadController.js`
- `backend/src/controllers/documentController.js`
- `backend/src/routes/uploadRoutes.js`
- `backend/src/routes/documentRoutes.js`
- `backend/src/app.js`

Atividades:

- Configurar `multer.diskStorage`.
- Implementar os três endpoints previstos.
- Padronizar respostas de sucesso e erro.

Critérios de aceite:

- Upload retorna `201`.
- Listagem retorna `200`.
- Download retorna o conteúdo binário correto.
- Falhas de validação retornam JSON consistente.

### Etapa 5: Frontend

Arquivos:

- `frontend/src/App.jsx`
- `frontend/src/components/UploadComponent.jsx`
- `frontend/src/components/DocumentList.jsx`
- `frontend/src/components/DownloadButton.jsx`
- `frontend/src/services/documentService.js`
- `frontend/src/pages/DocumentsPage.jsx`

Atividades:

- Criar formulário de upload.
- Exibir documentos do usuário atual.
- Implementar download.
- Exibir estados de carregamento, sucesso, lista vazia e erro.

Critérios de aceite:

- O usuário consegue enviar um documento pela interface.
- A lista é atualizada após upload.
- O download inicia corretamente.
- Erros da API são apresentados em português.

### Etapa 6: Testes

Arquivos:

- `backend/test/app.test.js`
- `backend/test/upload.test.js`
- `backend/test/documents.test.js`
- `backend/test/download.test.js`

Atividades:

- Testar health check.
- Testar upload válido e inválido.
- Testar isolamento por usuário.
- Testar listagem.
- Testar download e documento inexistente.

Critérios de aceite:

- `npm test` executa sem falhas.
- Os principais fluxos e erros possuem cobertura.
- Os testes não dependem de armazenamento externo.

## 10. Decisões arquiteturais

- O armazenamento será exclusivamente local.
- `multer` será usado com `diskStorage`.
- Metadados permanecerão em memória.
- O domínio não dependerá diretamente do Express.
- O controller será responsável apenas pela comunicação HTTP.
- Regras de ownership ficarão no service.
- O repository será responsável pela persistência.
- O frontend usará o proxy Vite para encaminhar `/api` ao backend.
- Não será adicionada uma camada de banco de dados nesta versão.

## 11. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Metadados são perdidos após reinício | Documentar a limitação e manter o escopo sem persistência nesta fase. |
| Arquivos órfãos no storage | Usar fluxo de registro controlado e documentar limpeza futura. |
| `X-User-Id` não oferece autenticação real | Tratar o mecanismo apenas como identificação de desenvolvimento. |
| Nomes de arquivo maliciosos | Gerar nome físico no servidor e nunca concatenar o nome original ao caminho. |
| Arquivos muito grandes | Configurar limite do `multer` por variável de ambiente. |
| Falhas durante o download | Validar existência do arquivo e retornar erro HTTP adequado. |

## 12. Critérios de aceite gerais

- O backend inicia com `npm start`.
- O backend passa nos testes com `npm test`.
- O frontend gera build com `npm run build`.
- Upload, listagem e download funcionam pelo frontend.
- Os arquivos ficam em `backend/storage`.
- Nenhum provedor externo é utilizado.
- A separação `routes -> controllers -> services -> repositories` é mantida.
- Documentos de um usuário não aparecem nem podem ser baixados por outro.
- A implementação não inclui versionamento, banco de dados ou autenticação completa.
