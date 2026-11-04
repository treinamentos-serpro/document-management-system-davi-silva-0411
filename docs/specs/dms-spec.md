# Especificação - Document Management System

## 1. Objetivo

Disponibilizar uma aplicação web para que usuários enviem, listem e baixem documentos, mantendo os arquivos no filesystem local e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de documentos por upload.
- Listagem dos documentos associados a um usuário.
- Download de um documento por identificador.
- Associação de documentos a um identificador de usuário.
- Interface React para upload, listagem e download.
- Tratamento de erros e estados de carregamento nas operações principais.

### Fora do escopo

- Armazenamento externo ou em nuvem.
- Banco de dados ou persistência durável dos metadados.
- Autenticação, autorização robusta ou gestão de contas.
- Versionamento, edição, exclusão ou compartilhamento de documentos.
- Busca avançada, pastas e processamento do conteúdo dos arquivos.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar um arquivo enviado como `multipart/form-data` no campo `file`. |
| RF-02 | O sistema deve gravar o conteúdo do arquivo localmente em `backend/storage`, usando Multer com `diskStorage`. |
| RF-03 | O sistema deve gerar um identificador único para cada documento e um nome interno não controlado pelo cliente para o arquivo armazenado. |
| RF-04 | O sistema deve registrar os metadados `id`, `originalName`, `size`, `uploadedAt` e `owner`. |
| RF-05 | O sistema deve listar somente documentos associados ao identificador de usuário informado na requisição. |
| RF-06 | O sistema deve permitir o download pelo identificador somente quando o documento estiver associado ao usuário informado. |
| RF-07 | O sistema deve retornar erro apropriado quando faltar usuário ou arquivo, o arquivo exceder o limite, o documento não existir ou não pertencer ao usuário. |
| RF-08 | A listagem deve apresentar os documentos do mais recente para o mais antigo. |
| RF-09 | O frontend deve permitir selecionar e enviar um arquivo, visualizar a lista do usuário e iniciar o download de um documento. |
| RF-10 | O frontend deve exibir estados de carregamento, sucesso e erro nas operações da API. |
| RF-11 | O identificador de usuário usado pelo frontend deve ser simples e selecionável/editável, sem ser apresentado como mecanismo de autenticação. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem permanecer no filesystem local da aplicação em `backend/storage`; não usar provedores externos. |
| RNF-02 | O recebimento dos arquivos deve usar Multer configurado com `diskStorage`. |
| RNF-03 | Os metadados devem permanecer em memória nesta fase e podem ser perdidos ao reiniciar o processo. |
| RNF-04 | Porta, diretório de armazenamento, limite de upload e cotas por usuário devem ser configuráveis por variáveis de ambiente. |
| RNF-05 | O backend deve seguir o fluxo de dependência `routes -> controllers -> services -> repositories`. |
| RNF-06 | O frontend deve acessar o backend via `fetch` usando o prefixo `/api`; o backend expõe as rotas sob `/api` e o proxy Vite apenas encaminha as chamadas. |
| RNF-07 | O nome original do arquivo não deve ser usado como caminho de armazenamento. |
| RNF-08 | Erros da API devem usar respostas JSON consistentes, exceto respostas de download bem-sucedidas, que são binárias. |
| RNF-09 | Mensagens e respostas de erro não devem revelar caminhos locais do filesystem. |
| RNF-10 | Downloads devem ser servidos como `application/octet-stream` com `X-Content-Type-Options: nosniff`, independentemente da extensão do nome original. |

## 5. Modelo de dados (metadados do documento)

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único, gerado pelo servidor; UUID é o formato recomendado. |
| `originalName` | string | Nome original fornecido pelo cliente, reduzido ao nome base, sem caracteres de controle e com até 255 caracteres; usado para exibição e nome sugerido no download. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora do upload em ISO 8601. |
| `owner` | string | Identificador do usuário associado ao documento. |

O `id` do documento é também o nome do arquivo em disco. O repositório guarda apenas esse nome (nunca um caminho absoluto) e resolve o arquivo sempre dentro do diretório de armazenamento. O caminho interno não é exposto pela API. Os metadados ficam em memória; como os arquivos existentes ficam sem dono após um reinício, o backend limpa o diretório de armazenamento (exceto `.gitkeep`) ao iniciar.

## 6. Contratos de API

### Convenções

- Os caminhos públicos incluem o prefixo `/api` usado pelo frontend.
- O Express monta as rotas sob `/api`; o proxy do Vite (dev e preview) encaminha as chamadas sem reescrever o caminho. `/health` também responde em `/api/health`.
- Todas as operações abaixo exigem `X-User-Id` com 1 a 128 caracteres entre letras, números, `.`, `_`, `-` e `@`.
- Nesta fase, `X-User-Id` serve somente para associação e filtragem. Não comprova a identidade do solicitante.
- A listagem retorna um array JSON ordenado do mais recente para o mais antigo.

### POST `/api/upload`

- Cabeçalho: `X-User-Id: <identificador-do-usuario>`.
- Entrada: `multipart/form-data`, com o arquivo no campo `file`.
- Sucesso: `201 Created`, corpo JSON com os metadados do documento criado.
- Erros:
  - `400 Bad Request`: identificador ausente/inválido, arquivo não enviado (`FILE_REQUIRED`) ou multipart com arquivos/campos extras (`INVALID_UPLOAD`).
  - `413 Payload Too Large`: limite de tamanho excedido (`FILE_TOO_LARGE`) ou cota do usuário atingida (`QUOTA_EXCEEDED`).
  - `500 Internal Server Error`: falha ao gravar arquivo ou registrar metadados.

### GET `/api/documents`

- Cabeçalho: `X-User-Id: <identificador-do-usuario>`.
- Sucesso: `200 OK`, corpo JSON com array de metadados pertencentes ao usuário; retorna `[]` quando não houver documentos.
- Erros:
  - `400 Bad Request`: identificador ausente ou inválido.
  - `500 Internal Server Error`: falha ao consultar o repositório.

### GET `/api/documents/:id/download`

- Cabeçalho: `X-User-Id: <identificador-do-usuario>`.
- Sucesso: `200 OK`, conteúdo binário do arquivo, `Content-Type: application/octet-stream`, `X-Content-Type-Options: nosniff`, `Cache-Control: private, no-store` e `Content-Disposition: attachment` com o nome original.
- Erros:
  - `400 Bad Request`: identificador de usuário ausente/inválido ou formato de `id` inválido.
  - `404 Not Found`: documento inexistente, associado a outro usuário ou arquivo local indisponível.
  - `500 Internal Server Error`: outra falha durante a leitura do arquivo.

### Formato JSON de erro

    {
      "error": {
        "code": "DOCUMENT_NOT_FOUND",
        "message": "Documento não encontrado."
      }
    }

Os códigos devem distinguir, no mínimo, usuário inválido, arquivo obrigatório, upload inválido ou acima do limite, identificador inválido, documento/arquivo não encontrado e falha interna. Mensagens destinadas ao cliente devem ser seguras e em português.

## 7. Decisões arquiteturais

- `routes/`: registra endpoints e delega para controllers.
- `controllers/`: valida entrada HTTP e parâmetros, chama os serviços e traduz resultados para respostas HTTP.
- `services/`: concentra regras de upload, associação ao usuário e verificação do proprietário.
- `repositories/`: mantém metadados em memória e associa cada documento ao arquivo local.
- Multer deve usar `diskStorage` e nome interno gerado pelo servidor; o nome ou caminho informado pelo cliente não pode determinar o caminho de armazenamento.
- Os arquivos devem ser armazenados exclusivamente em `backend/storage`. Nenhum provedor de armazenamento externo deve ser utilizado.
- Configuração centralizada em `src/config.js`, por variáveis de ambiente:

  | Variável | Padrão | Descrição |
  | --- | --- | --- |
  | `PORT` | `3000` | Porta HTTP do backend. |
  | `STORAGE_DIR` | `backend/storage` | Diretório local dos arquivos. |
  | `MAX_FILE_SIZE_BYTES` | `10485760` (10 MiB) | Tamanho máximo por arquivo. |
  | `MAX_FILES_PER_USER` | `100` | Quantidade máxima de documentos por usuário. |
  | `MAX_BYTES_PER_USER` | `104857600` (100 MiB) | Soma máxima de bytes por usuário. |

  No frontend, `VITE_MAX_FILE_SIZE_BYTES` deve acompanhar `MAX_FILE_SIZE_BYTES` para validar o tamanho antes do envio.
- `src/server.js` é o ponto de entrada (limpeza do storage e `listen`); `src/app.js` apenas compõe a aplicação (`createApp`).
- A configuração do Multer fica em `middlewares/upload.js` (`files: 1`, `fields: 0`, nomes UTF-8); o tratamento de erros, em `middlewares/error-handler.js`, que registra em log as falhas internas.
- O frontend deve manter componentes reutilizáveis em `components/` e chamadas HTTP em `services/`, sempre usando o prefixo `/api`.
- O identificador recebido em `X-User-Id` não é autenticação. O sistema é destinado a uso local/demonstração até que um mecanismo de identidade seja definido.

## 8. Plano de execução

As etapas abaixo descrevem implementação futura. Esta especificação não executa nem altera arquivos de backend ou frontend.

1. **Implementar o repositório e serviço de documentos.** O repositório manterá metadados em memória e a associação ao caminho local; o serviço aplicará as regras de proprietário e registro. Critérios: caminhos não são expostos; falha ao registrar metadados trata o arquivo recém-enviado; listagem é filtrada e ordenada.
2. **Implementar rotas, controllers e composição do backend.** Configurar Multer com `diskStorage`, limite configurável e gravação em `backend/storage`. Critérios: endpoints respeitam os contratos, erros têm status/formato definidos e `/health` existente continua funcionando.
3. **Adicionar testes do backend com `node:test`.** Cobrir upload válido e inválido, limite de tamanho, listagem por usuário, download autorizado, acesso por outro usuário e documento inexistente. Os testes devem usar diretório temporário e removê-lo ao final.
4. **Implementar o serviço e componentes do frontend.** Criar chamadas `fetch` para upload, listagem e download e a interface para selecionar usuário, enviar arquivo e operar a biblioteca. Critérios: estados de carregamento, vazio, sucesso e erro são tratados; o frontend usa `/api` e não define manualmente o `Content-Type` do `FormData`.
5. **Verificar integração local e documentação operacional.** Executar testes do backend e build do frontend; confirmar proxy Vite, variáveis `PORT` e `MAX_FILE_SIZE_BYTES`, diretório local e comportamento após reinício. Documentar a volatilidade dos metadados e a ausência de autenticação.

## 9. Riscos e pressupostos

- Como os metadados são voláteis, reiniciar o backend remove as associações em memória; os arquivos órfãos são apagados na inicialização.
- `X-User-Id` pode ser escolhido pelo próprio solicitante e não oferece isolamento seguro em ambiente multiusuário não confiável. As cotas por usuário reduzem, mas não eliminam, o risco de esgotamento de disco, pois um cliente pode alternar identificadores.
- O limite padrão é 10 MiB; qualquer configuração diferente deve ser refletida também na interface e na documentação operacional.
- Não há restrição de tipos de arquivo nesta fase. Se forem necessários formatos permitidos, essa política deve ser definida antes da implementação.