# 📍 SmartCEP

> Wrapper resiliente de consulta de CEP com cache inteligente, fallback automático entre providers e CRUD de endereços salvos.

Desenvolvido por **Pedro Savio**

---

## Visão Geral

SmartCEP é uma aplicação fullstack Node.js que resolve um problema clássico de dependência de APIs externas: **e se a API cair?** A arquitetura em camadas garante que toda consulta de CEP passe por três estágios — cache local, provider primário e provider de fallback — de forma completamente transparente para o usuário.

Além da busca resiliente, a aplicação oferece um CRUD completo de endereços salvos com apelidos personalizados, permitindo ao usuário organizar seus locais frequentes com nomes como "Casa", "Trabalho" ou "Academia".

---

## Funcionalidades

- Busca de CEP com fallback automático em cadeia (Cache → BrasilAPI → ViaCEP)
- Cache persistente em banco de dados PostgreSQL para eliminar chamadas redundantes
- Modo de simulação de falha no provider primário via variável de ambiente (`FORCE_PRIMARY_FAIL`)
- CRUD completo de endereços salvos com apelido personalizável
- Interface web responsiva com modais nativos (sem dependências de UI externas)
- Logging estruturado com Winston em arquivo e console colorido
- Health check da aplicação e do banco de dados

---

## Arquitetura

```
smartcep/
├── public/
│   └── index.html              # Frontend (SPA vanilla JS)
├── src/
│   ├── server.js               # Entry point, configuração do Express
│   ├── config/
│   │   └── database.js         # Pool de conexão PostgreSQL (Neon)
│   ├── routes/
│   │   ├── cep.routes.js       # GET /cep/:cep
│   │   └── address.routes.js   # CRUD /addresses
│   ├── services/
│   │   ├── cep.service.js      # Lógica de busca resiliente + cache
│   │   └── address.service.js  # Operações no banco para endereços
│   ├── providers/
│   │   ├── brasilapi.provider.js   # Integração com BrasilAPI v2
│   │   └── viacep.provider.js      # Integração com ViaCEP
│   ├── middlewares/
│   │   ├── requestLogger.js    # Log de cada requisição com latência
│   │   └── errorHandler.js     # Tratamento centralizado de erros
│   └── utils/
│       └── logger.js           # Instância configurada do Winston
├── init-db.sql                 # Script de criação das tabelas
├── package.json
└── .env
```

### Fluxo de Busca de CEP

```
Requisição GET /cep/:cep
         │
         ▼
  ┌─────────────┐
  │ Cache (DB)  │ ──── HIT ───▶ Retorna imediatamente (0ms)
  └─────────────┘
         │ MISS
         ▼
  ┌─────────────┐
  │  BrasilAPI  │ ──── OK ────▶ Salva no cache → Retorna
  └─────────────┘
         │ FALHA / FORCE_PRIMARY_FAIL=true
         ▼
  ┌─────────────┐
  │   ViaCEP    │ ──── OK ────▶ Salva no cache → Retorna
  └─────────────┘
         │ FALHA
         ▼
  Lança erro 404 para o cliente
```

---

## Stack Tecnológica

### Backend

| Tecnologia | Versão | Por que foi escolhida |
|---|---|---|
| **Node.js** | ≥ 18 | Runtime JavaScript maduro com suporte nativo a ES Modules e excelente ecossistema para APIs |
| **Express 5** | ^5.2 | Framework minimalista e flexível; versão 5 traz async error handling nativo, eliminando a necessidade de `try/catch` em cada rota |
| **PostgreSQL** | — | Banco relacional robusto com suporte a `ON CONFLICT DO NOTHING` para o cache de CEPs e timestamps automáticos |
| **pg** | ^8.20 | Driver PostgreSQL oficial para Node.js com suporte a connection pooling |
| **Axios** | ^1.15 | Cliente HTTP com timeout configurável, interceptors e melhor legibilidade que `fetch` nativo para chamadas a APIs externas |
| **Winston** | ^3.19 | Logger estruturado com transports múltiplos (console colorido + arquivos separados por nível), indispensável em ambientes de produção |
| **dotenv** | ^17 | Gerenciamento de variáveis de ambiente sem expor segredos no código |
| **nodemon** | ^3.1 | Reinício automático do servidor em desenvolvimento; mantido como devDependency para não inflar a imagem de produção |

### Banco de Dados

O projeto usa **Neon** como provedor de PostgreSQL serverless. A escolha permite conexão via `DATABASE_URL` com suporte a SSL, sem necessidade de provisionar infraestrutura local para desenvolvimento.

Duas tabelas são criadas via `init-db.sql`:

**`cep_cache`** — armazena resultados de buscas bem-sucedidas. A chave primária é o próprio CEP (8 dígitos), garantindo unicidade e busca O(1). O campo `cached_at` permite implementar expiração futura de cache.

**`addresses`** — tabela de endereços salvos pelo usuário com `SERIAL PRIMARY KEY`, apelido livre e timestamps de criação/atualização. Índices em `cep` em ambas as tabelas garantem performance nas buscas.

### Frontend

Interface desenvolvida em **HTML/CSS/JS puro**, sem frameworks ou bundlers. Esta decisão foi intencional: o frontend é simples o suficiente para não justificar a complexidade de um bundler, e a ausência de dependências de UI torna o carregamento instantâneo.

Destaques da implementação:

- **Sistema de modais próprio** — substitui `alert()`, `confirm()` e `prompt()` nativos do browser por modais acessíveis com animação CSS spring, backdrop blur e suporte a teclado (Enter/Escape)
- **Toast notifications** — feedback não-bloqueante para ações de sucesso no rodapé da tela
- **Máscara de CEP** — formatação automática `00000-000` durante a digitação
- **Fonte DM Mono** — aplicada ao display de CEPs para melhor legibilidade de números sequenciais

### Providers de CEP

**BrasilAPI** é usada como provider primário por oferecer dados enriquecidos (IBGE, DDD) e SLA mais estável. **ViaCEP** funciona como fallback — amplamente conhecida, com alta disponibilidade e resposta rápida.

Ambos os providers são classes instanciadas como singletons (`export default new Provider()`), o que facilita mock em testes futuros e garante que timeouts de 5 segundos sejam respeitados em cada chamada.

A variável `FORCE_PRIMARY_FAIL=true` no `.env` simula uma falha da BrasilAPI em todos os ambientes, útil para testar o comportamento de fallback sem depender de uma indisponibilidade real.

---

## Padrões de Projeto

**Separação de responsabilidades em camadas** — Routes não contêm lógica de negócio; Services não conhecem o protocolo HTTP; Providers não sabem nada sobre banco de dados. Cada camada tem uma única responsabilidade.

**Provider Pattern** — Os providers de CEP seguem uma interface implícita (`buscarCEP(cep): Promise<{ success, data, latency }>`), o que permite adicionar novos providers (ex: Postmon, CEPAberto) sem alterar o Service.

**Cache-aside** — O cache é consultado antes de qualquer chamada externa. Em caso de miss, o resultado da API é persistido antes de retornar ao cliente, garantindo que a próxima consulta ao mesmo CEP seja instantânea.

**Centralized Error Handling** — O middleware `errorHandler.js` captura todos os erros propagados via `next(error)` e retorna uma resposta JSON padronizada com status HTTP correto, sem vazar stack traces para o cliente em produção.

---

## Instalação e Execução

### Pré-requisitos

- Node.js 18 ou superior
- Uma instância PostgreSQL (local ou Neon)

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/smartcep.git
cd smartcep

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com sua DATABASE_URL

# 4. Crie as tabelas no banco
psql $DATABASE_URL -f init-db.sql

# 5. Inicie em desenvolvimento
npm run dev

# Ou em produção
npm start
```

A aplicação estará disponível em `http://localhost:3000`.

### Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | ✅ Sim | Connection string PostgreSQL (ex: `postgresql://user:pass@host/db?sslmode=require`) |
| `PORT` | ❌ Não | Porta do servidor (padrão: `3000`) |
| `FORCE_PRIMARY_FAIL` | ❌ Não | Se `true`, ignora a BrasilAPI e usa ViaCEP diretamente (para testes de fallback) |

---

## API Reference

### `GET /cep/:cep`

Busca um CEP com fallback automático.

**Parâmetros:** `cep` — 8 dígitos numéricos (com ou sem máscara)

**Resposta de sucesso:**
```json
{
  "success": true,
  "cep": "01310100",
  "logradouro": "Avenida Paulista",
  "complemento": "de 1 a 610 - lado par",
  "bairro": "Bela Vista",
  "localidade": "São Paulo",
  "uf": "SP",
  "source": "BrasilAPI",
  "latency": 312
}
```

O campo `source` indica a origem dos dados: `"cache"`, `"BrasilAPI"` ou `"ViaCEP (fallback)"`.

---

### `GET /addresses`

Lista todos os endereços salvos, ordenados pelo mais recente.

---

### `POST /addresses`

Salva um novo endereço com apelido.

**Body:**
```json
{
  "cep": "01310100",
  "apelido": "Trabalho",
  "logradouro": "Avenida Paulista",
  "localidade": "São Paulo",
  "uf": "SP"
}
```

---

### `PUT /addresses/:id`

Atualiza o apelido de um endereço salvo.

**Body:** `{ "apelido": "Novo Apelido" }`

---

### `DELETE /addresses/:id`

Remove um endereço salvo.

---

### `GET /health`

Verifica o status da aplicação e a conectividade com o banco.

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-04-18T12:00:00.000Z"
}
```

---

## Logs

Winston grava logs em dois arquivos na pasta `logs/` (criada automaticamente):

- `logs/combined.log` — todas as requisições e eventos
- `logs/error.log` — apenas erros

No console, os logs são coloridos por nível. Formato:

```
2025-04-18 12:00:00 [INFO] GET /cep/01310100 200 312ms {"ip":"::1"}
2025-04-18 12:00:01 [INFO] Busca de CEP realizada {"cep":"01310100","source":"cache","latency":0}
```

---

## Possíveis Evoluções

- Expiração de cache por TTL (ex: invalidar entradas com mais de 30 dias)
- Paginação na listagem de endereços
- Autenticação por usuário para endereços pessoais
- Adição de novos providers (Postmon, OpenCEP) sem alterar a lógica de busca
- Testes unitários com mocks dos providers via Jest
- Containerização com Docker e docker-compose

---

## Licença

MIT © Pedro Savio