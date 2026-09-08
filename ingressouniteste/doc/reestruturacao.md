# Plano de Reestruturacao Arquitetural — Padrao MVC

---

## 1. Analise do Estado Atual da Aplicacao

### 1.1 Stack Tecnologica

| Camada       | Tecnologia                          |
|--------------|-------------------------------------|
| Backend      | Node.js + Express 4.21.2            |
| Banco        | SQLite via better-sqlite3 (WAL)     |
| Frontend     | HTML5 + Tailwind CSS (CDN) + JS ES6 |
| Modulos      | CommonJS (`require`/`module.exports`)|
| Seguranca    | Helmet, CORS, validator             |

### 1.2 Arquitetura Atual

O projeto ja possui uma estrutura parcialmente organizada com nomes em portugues, mas **nao segue o MVC de forma completa**. A principais falhas:

1. **Ausencia de Camada de Modelo (`modelos/`)**: Os controladores contem SQL direto. Nao existe abstracao de acesso a dados.
2. **Servicos duplicados e nao utilizados**: O diretorio `servicos/` existe, mas nenhum controlador o importa. As mesmas queries SQL estao duplicadas nos controladores.
3. **Ausencia de middleware de erros**: Nao existe middleware global de tratamento de erros no Express.
4. **Ausencia de testes**: Zero arquivos de teste no projeto.
5. **Seguranca fragil**: CORS wildcard, CSP desabilitada, ownership fraco em favoritos, sem rate limiting.

### 1.3 Mapeamento Atual de Arquivos

```
api/
├── iniciarBanco.js                    -> DDL + seed data
├── src/
│   ├── app.js                         -> Express app (middlewares + rotas)
│   ├── server.js                      -> Start do servidor
│   ├── config/
│   │   └── conexaoBanco.js            -> Conexao SQLite
│   ├── controladores/
│   │   ├── buscaControlador.js        -> Logica de busca unificada
│   │   ├── universidadeControlador.js -> Detalhes de instituicao/curso
│   │   └── favoritoControlador.js     -> CRUD de favoritos
│   ├── rotas/
│   │   ├── buscaRotas.js              -> Rotas de busca
│   │   ├── universidadeRotas.js       -> Rotas de instituicao/curso
│   │   └── favoritoRotas.js           -> Rotas de favoritos
│   ├── servicos/
│   │   ├── integracaoSisu.js          -> [MORTO] Queries duplicadas
│   │   ├── integracaoCustoVida.js     -> [MORTO] Queries duplicadas
│   │   └── sincronizadorDados.js      -> [MORTO] Nunca chamado
│   └── utilitarios/
│       └── validadores.js             -> Sanitizacao/validacao

frontend/
├── index.html                         -> Pagina inicial/busca
├── css/estilo.css                     -> Estilos customizados
├── js/
│   ├── api.js                         -> Cliente Fetch generico
│   ├── busca.js                       -> Logica da pagina de busca
│   ├── detalhes.js                    -> Logica da pagina de detalhes
│   ├── favoritos.js                   -> Sistema de favoritos
│   ├── componentes.js                 -> Componentes HTML reutilizaveis
│   ├── dadosDemo.js                   -> Dados de fallback/demo
│   └── util.js                        -> Funcoes utilitarias frontend
├── paginas/
│   ├── detalhes.html                  -> Pagina de detalhes do curso
│   └── favoritos.html                 -> Pagina de favoritos
└── assets/
    ├── logo.svg
    └── imagens/hero.svg
```

---

## 2. Nova Arvore de Diretorios (MVC em PT-BR)

```
ingressouniversidade/
│
├── api/
│   ├── package.json
│   ├── package-lock.json
│   ├── iniciarBanco.js
│   └── src/
│       ├── app.js
│       ├── server.js
│       │
│       ├── configuracoes/             [RENOMEADO de config/]
│       │   └── conexaoBanco.js
│       │
│       ├── modelos/                   [NOVO - Camada de Modelo]
│       │   ├── instituicaoModelo.js
│       │   ├── cursoModelo.js
│       │   ├── notaCorteModelo.js
│       │   ├── custoCidadeModelo.js
│       │   ├── auxilioBolsaModelo.js
│       │   ├── mercadoEstagioModelo.js
│       │   └── favoritoModelo.js
│       │
│       ├── controladores/             [MANTIDO]
│       │   ├── buscaControlador.js
│       │   ├── universidadeControlador.js
│       │   └── favoritoControlador.js
│       │
│       ├── intermediarios/            [NOVO - Middlewares]
│       │   ├── tratamentoErros.js
│       │   └── logger.js
│       │
│       ├── rotas/                     [MANTIDO]
│       │   ├── buscaRotas.js
│       │   ├── universidadeRotas.js
│       │   └── favoritoRotas.js
│       │
│       ├── servicos/                  [MANTIDO - reescrito]
│       │   ├── integracaoSisu.js
│       │   └── integracaoCustoVida.js
│       │
│       └── utilitarios/               [MANTIDO]
│           └── validadores.js
│
├── frontend/                          [MANTIDO - sem alteracoes]
│   ├── index.html
│   ├── css/estilo.css
│   ├── js/
│   │   ├── api.js
│   │   ├── busca.js
│   │   ├── detalhes.js
│   │   ├── favoritos.js
│   │   ├── componentes.js
│   │   ├── dadosDemo.js
│   │   └── util.js
│   ├── paginas/
│   │   ├── detalhes.html
│   │   └── favoritos.html
│   └── assets/
│       ├── logo.svg
│       └── imagens/hero.svg
│
├── doc/                               [MANTIDO]
│   ├── reestruturacao.md              [ESTE ARQUIVO]
│   ├── prompt_mvc_deepseek_v2.md
│   └── backup/ ...
│
└── .gitignore
```

---

## 3. Mapeamento de Arquivos Atuais para a Nova Estrutura

### 3.1 Arquivos que Serao RENOMEADOS/MOVIDOS

| Arquivo Atual                          | Novo Caminho                           | Acao            |
|----------------------------------------|----------------------------------------|-----------------|
| `api/src/config/conexaoBanco.js`       | `api/src/configuracoes/conexaoBanco.js`| Renomear pasta  |

### 3.2 Arquivos NOVOS a serem criados (Modelos)

| Novo Arquivo                           | Responsabilidade                                         | Fonte dos Dados                |
|----------------------------------------|----------------------------------------------------------|--------------------------------|
| `modelos/instituicaoModelo.js`         | Consultas e regras de negocio para instituicoes          | `universidadeControlador.js`   |
| `modelos/cursoModelo.js`               | Consultas e regras de negocio para cursos                | `universidadeControlador.js`   |
| `modelos/notaCorteModelo.js`           | Consultas de notas de corte                              | `universidadeControlador.js`   |
| `modelos/custoCidadeModelo.js`         | Consultas de custos de vida por cidade                   | `universidadeControlador.js`   |
| `modelos/auxilioBolsaModelo.js`        | Consultas de auxilios e bolsas                           | `universidadeControlador.js`   |
| `modelos/mercadoEstagioModelo.js`      | Consultas de mercado de trabalho e estagios              | `universidadeControlador.js`   |
| `modelos/favoritoModelo.js`            | CRUD de favoritos                                        | `favoritoControlador.js`       |

### 3.3 Arquivos NOVOS a serem criados (Intermediarios)

| Novo Arquivo                           | Responsabilidade                                         |
|----------------------------------------|----------------------------------------------------------|
| `intermediarios/tratamentoErros.js`    | Middleware global de tratamento de erros Express          |
| `intermediarios/logger.js`             | Middleware de log de requisicoes (simplificado)           |

### 3.4 Arquivos que SERAO REESCRITOS

| Arquivo                                | Mudanca                                                   |
|----------------------------------------|-----------------------------------------------------------|
| `controladores/buscaControlador.js`    | Delegar queries para `cursoModelo.js` e `instituicaoModelo.js` |
| `controladores/universidadeControlador.js` | Delegar queries para os modelos correspondentes      |
| `controladores/favoritoControlador.js` | Delegar queries para `favoritoModelo.js`                  |
| `servicos/integracaoSisu.js`           | Reescrever para orquestrar chamadas aos modelos           |
| `servicos/integracaoCustoVida.js`      | Reescrever para orquestrar chamadas aos modelos           |
| `app.js`                               | Adicionar intermediarios de erro e logger                 |

### 3.5 Arquivos a serem REMOVIDOS

| Arquivo                                | Motivo                                                    |
|----------------------------------------|-----------------------------------------------------------|
| `servicos/sincronizadorDados.js`       | Codigo morto, nunca utilizado, funcao indevida de servico  |

---

## 4. Estrategia de Migracao

### Fase 1: Configuracao e Intermediarios
1. Renomear `config/` para `configuracoes/`
2. Criar `intermediarios/tratamentoErros.js` — middleware Express de erro `(err, req, res, next)`
3. Criar `intermediarios/logger.js` — middleware simples de log (method, url, status, tempo)
4. Atualizar `app.js` para importar e usar os intermediarios

### Fase 2: Camada de Modelos
Extrair toda logica de acesso ao banco dos controladores para modelos dedicados:

1. **`instituicaoModelo.js`**: `listar()`, `detalhar(id)`, `buscarPorFiltros({nome, cidade, estado})`
2. **`cursoModelo.js`**: `listar()`, `detalhar(id)`, `buscarPorInstituicao(instituicaoId)`
3. **`notaCorteModelo.js`**: `buscarPorCurso(cursoId)`, `buscarPorInstituicao(instituicaoId)`
4. **`custoCidadeModelo.js`**: `buscarPorCidade(cidade, estado)`, `listarCidades()`
5. **`auxilioBolsaModelo.js`**: `buscarPorInstituicao(instituicaoId)`
6. **`mercadoEstagioModelo.js`**: `buscarPorCurso(cursoId)`
7. **`favoritoModelo.js`**: `adicionar(cursoId, instituicaoId, sessaoUsuario)`, `listar(sessaoUsuario)`, `remover(id, sessaoUsuario)`, `verificarExistencia(cursoId, sessaoUsuario)`

Cada modelo:
- Importa `conexaoBanco` de `configuracoes/`
- Prepara statements SQL com `conexaoBanco.prepare()`
- Exporta funcoes que retornam dados puros (objetos/arrays)
- Trata validacao de tipos de entrada

### Fase 3: Reescrita dos Controladores
Refatorar cada controlador para:
- Importar os modelos relevantes
- Chamar os metodos dos modelos em vez de SQL direto
- Manter apenas logica de HTTP (request/response, status codes, parsing de params)
- Usar `try/catch` com `next(erro)` para propagar erros ao middleware

### Fase 4: Reescrita dos Servicos
Reescrever os servicos para atuar como camada de orquestracao:
- **`integracaoSisu.js`**: Orquestrar busca de notas de corte + dados de cursos
- **`integracaoCustoVida.js`**: Orquestrar busca de custos + calculos
- Remover `sincronizadorDados.js` (codigo morto)

### Fase 5: Atualizacao do app.js
- Importar `tratamentoErros.js` e `logger.js`
- Adicionar `logger` como middleware global
- Adicionar `tratamentoErros` como ultimo middleware
- Manter a ordem: helmet -> cors -> json -> logger -> static -> rotas -> fallback -> tratamentoErros

---

## 5. Plano de Testes

Como nao existem testes no projeto, a migracao deve ser validada manualmente:

### 5.1 Testes de Validacao Pos-Migracao

| Criterio                                                  | Metodo de Verificacao                                     |
|-----------------------------------------------------------|-----------------------------------------------------------|
| API responde em todas as rotas GET                         | `curl` ou navegador para cada endpoint                    |
| Busca funciona com filtros (nome, cidade, estado)          | Testar `/api/busca?nome=...`, `?cidade=...`, `?estado=...`|
| Detalhar instituicao retorna dados corretos                | `curl /api/instituicoes/1`                                |
| Detalhar curso retorna dados completos                     | `curl /api/cursos/1`                                      |
| Notas de corte, auxilios, mercado retornam corretamente    | Testar sub-endpoints de `/api/cursos/:id/...`             |
| Custos de cidade retornam corretamente                     | `curl /api/cidades/Cuiaba/custos`                         |
| Favoritos CRUD funciona completo                           | POST, GET, DELETE em `/api/favoritos`                     |
| Favoritos com sessao invalida retorna erro                 | Testar com sessao_usuario invalida                        |
| Frontend carrega corretamente                              | Abrir `http://localhost:PORT` no navegador                |
| Navegacao entre paginas funciona                           | Clicar em resultados, favoritos, voltar                   |
| Tratamento de erros retorna JSON (nao HTML do Express)     | Enviar request invalida e verificar resposta              |
| Logs aparecem no console do servidor                       | Verificar output do terminal                              |

### 5.2 Cenarios de Borda

| Cenario                                                  | Esperado                                                  |
|----------------------------------------------------------|-----------------------------------------------------------|
| ID invalido (negativo, zero, nao numerico)               | 400 Bad Request                                           |
| Busca sem parametros                                     | Retorna todos os registros (ou erro 400)                  |
| Favorito duplicado                                        | 409 Conflict ou 400 Bad Request                           |
| Remover favorito inexistente                              | 404 Not Found                                             |
| Remover favorito de outro usuario                         | 403 Forbidden                                             |
| Curso inexistente                                         | 404 Not Found                                             |
| Request body gigante                                      | 413 Payload Too Large (limite 10kb do Express)            |

---

## 6. Diagrama de Fluxo Pos-Reestruturacao

```
Requisicao HTTP
    │
    ▼
┌─────────────────────────────────┐
│  app.js                         │
│  ├── Helmet                      │
│  ├── CORS                        │
│  ├── JSON Parser                 │
│  ├── logger (intermediarios/)    │
│  ├── Static Files (frontend/)    │
│  └── Rotas (rotas/)              │
│        │                         │
│        ▼                         │
│  Controladores (controladores/)  │
│        │                         │
│        ├── Valida (utilitarios/) │
│        │                         │
│        ├── Chama Modelo          │
│        │     │                   │
│        │     ▼                   │
│        │  Modelos (modelos/)     │
│        │     │                   │
│        │     ▼                   │
│        │  conexaoBanco           │
│        │  (configuracoes/)       │
│        │     │                   │
│        │     ▼                   │
│        │  SQLite DB              │
│        │                         │
│        └── Retorna Response      │
│                                  │
│  tratamentoErros (intermediarios/) ←─ erros propagados com next(erro)
└─────────────────────────────────┘
```

---

## 7. Convencoes de Codigo

### 7.1 Nomenclatura de Arquivos
- Modelos: `{entidade}Modelo.js` (ex: `cursoModelo.js`)
- Controladores: `{entidade}Controlador.js` (ex: `favoritoControlador.js`)
- Intermediarios: `{funcao}.js` (ex: `tratamentoErros.js`)
- Servicos: `{funcao}.js` (ex: `integracaoSisu.js`)

### 7.2 Padrao dos Modelos
```javascript
const conexaoBanco = require('../configuracoes/conexaoBanco');

function listar() {
  const resultado = conexaoBanco.prepare('SELECT * FROM tabela').all();
  return resultado;
}

function detalhar(id) {
  const resultado = conexaoBanco.prepare('SELECT * FROM tabela WHERE id = ?').get(id);
  return resultado;
}

module.exports = { listar, detalhar };
```

### 7.3 Padrao dos Controladores (pos-reestruturacao)
```javascript
const modelo = require('../modelos/entidadeModelo');

async function listar(req, res, next) {
  try {
    const dados = modelo.listar();
    res.json(dados);
  } catch (erro) {
    next(erro);
  }
}

module.exports = { listar };
```

### 7.4 Padrao do Middleware de Erros
```javascript
function tratamentoErros(erro, req, res, next) {
  console.error(`[ERRO] ${req.method} ${req.url}:`, erro.message);
  const status = erro.status || 500;
  res.status(status).json({
    erro: status === 500 ? 'Erro interno do servidor' : erro.message
  });
}

module.exports = tratamentoErros;
```

---

## 8. Ordem de Execucao

| Passo | Descricao                                                  | Depende De |
|-------|------------------------------------------------------------|------------|
| 1     | Renomear `config/` para `configuracoes/`                   | Nada       |
| 2     | Criar `intermediarios/tratamentoErros.js`                  | Nada       |
| 3     | Criar `intermediarios/logger.js`                           | Nada       |
| 4     | Criar os 7 arquivos de modelos em `modelos/`               | Passo 1    |
| 5     | Reescrever os 3 controladores para usar modelos            | Passo 4    |
| 6     | Reescrever servicos para orquestrar modelos                | Passo 4    |
| 7     | Remover `sincronizadorDados.js`                            | Passo 6    |
| 8     | Atualizar `app.js` com intermediarios                      | Passos 2-3 |
| 9     | Atualizar todas as rotas (imports renomeados)              | Passo 1    |
| 10    | Validar todas as rotas manualmente (curl/navegador)        | Passos 1-9 |
| 11    | Validar frontend completo (navegacao, busca, favoritos)    | Passo 10   |

---

## 9. Riscos e Mitigacoes

| Risco                                                      | Mitigacao                                                |
|------------------------------------------------------------|----------------------------------------------------------|
| Quebrar imports existentes ao renomear `config/`           | Atualizar TODOS os arquivos que importam `conexaoBanco`  |
| Modelos retornam formato diferente do esperado             | Manter compatibilidade de retorno (mesmos campos)        |
| Frontend quebra por mudanca nas respostas da API           | Manter contratos de API identicos (mesmos JSONs)         |
| Dados de demo ficam inconsistentes                         | Nao alterar `dadosDemo.js` (e frontend estatico)         |

---

## 10. Resumo das Melhorias

| Aspecto             | Antes                       | Depois                              |
|---------------------|-----------------------------|-------------------------------------|
| Acesso a dados      | SQL nos controladores       | Camada de modelos dedicada          |
| Tratamento de erros | Nenhum                      | Middleware global Express           |
| Logging             | Nenhum                      | Middleware de log                   |
| Servicos            | Codigo morto/duplicado      | Camada de orquestracao ativa        |
| Codigo morto        | `sincronizadorDados.js`     | Removido                            |
| Nomes de pastas     | Parcialmente em PT-BR       | 100% em PT-BR                       |
| Acoplamento         | Controlador -> DB direto    | Controlador -> Modelo -> DB         |
| Testes manuais      | Nenhum criterio             | Cenarios documentados               |
