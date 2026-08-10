# Plano de Modificação — Ingresso Universitário

> **Projeto Integrador I — Grupo 3**
> Integrantes: Gabriel Henrique Leal Arruda, João Pedro de Paula Rauh Nascimento, Italo Borges Santana e Cauã Fernandes Oliveira Domingos
> Disciplina: Projeto Integrador I — Professor: André Lôbo
> Documento base: arquivos `.docx` e `.xlsx` em `doc/backup/`

---

## 1. Contexto e Objetivo

O repositório atual contém uma **Landing Page de captura de leads** (Node.js + Express + SQLite),
que não tem relação com a documentação de escopo do Grupo 3 (documentos `doc/backup/*.docx` e
`doc/backup/*.xlsx`), cujo objetivo é um **aplicativo que auxilia estudantes na escolha de
universidade e curso superior**.

Este plano descreve a **modificação/reenquadramento do projeto** para atender ao escopo documentado,
aproveitando a arquitetura e as boas práticas já existentes (Express + SQLite + frontend estático).

### Fontes da documentação (lidas)

| Arquivo | Conteúdo |
|---|---|
| `Problema e Solução - NOMEGRUPO.docx` | Dor identificada e solução proposta (app de apoio à escolha) |
| `requisitos.docx` | Requisitos funcionais (RF1–RF6) e não funcionais (RNF1–RNF5) |
| `Mapa de Empatia - NOMEGRUPO.docx` | Personas: aluna (35–45, classe média) e pais |
| `Dores dos aluno na escolha de uma faculdade (respostas).xlsx` | Pesquisa: dificuldade de achar notas de corte, custos de moradia, bolsas/auxílios, mercado de trabalho |
| `Exemplo - Histórias de Usuário ... .docx` | **Modelo de referência** — formato a seguir na escrita das histórias de usuário |
| `site figma.docx` | Links do protótipo: [Figma](https://www.figma.com/make/8jqXrpZ5r3QjANhOBLxaaD/Student-College-Decision-App) e [site publicado](https://shared-bulk-68320921.figma.site/) |

---

## 2. Problema e Solução (resumo documentado)

**Problema.** Estudantes têm dificuldade de encontrar, de forma clara e centralizada: notas de corte,
custos de moradia e despesas em outras cidades, bolsas/auxílios estudantis, oportunidades de estágio
e a demanda do curso no mercado da região pretendida.

**Solução.** Um aplicativo web ("Ingresso Universitário") que reúne essas informações:

- notas de corte do curso (SiSU, ProUni);
- custos estimados de moradia/despesas da cidade;
- bolsas, auxílios e oportunidades de estágio da instituição;
- panorama do mercado de trabalho/demanda do curso na região;
- busca por universidades e cursos com filtros;
- favoritos para acesso rápido.

---

## 3. Requisitos de Escopo (extraídos da documentação)

### 3.1 Requisitos funcionais

| ID | Requisito | Descrição |
|---|---|---|
| RF1 | Busca de Cursos e Instituições | Buscar universidades e cursos com filtros simples (cidade, estado, nome) |
| RF2 | Exibição de Notas de Corte | Apresentar as últimas notas de corte do curso (ex.: SiSU, ProUni) |
| RF3 | Painel de Custos Estimados | Estimar/média de custos básicos (moradia e despesas) da cidade da universidade |
| RF4 | Mural de Auxílios e Bolsas | Listar permanência estudantil, auxílios financeiros e bolsas da instituição |
| RF5 | Indicador de Mercado e Estágios | Panorama da demanda do curso na região + lista de estágios integrados |
| RF6 | Sistema de Favoritos | Favoritar cursos/universidades para acesso rápido posterior |

### 3.2 Requisitos não funcionais

| ID | Requisito | Diretriz |
|---|---|---|
| RNF1 | Usabilidade e Simplicidade | Interface minimalista e intuitiva; informação essencial em até 3 cliques |
| RNF2 | Desempenho | Resposta de buscas e telas de detalhes ≤ 2 segundos |
| RNF3 | Responsividade (web) | Web app responsivo (desktop e mobile), sem instalação |
| RNF4 | Confiabilidade dos Dados | Dados de notas, custos e mercado vindos de fontes/APIs com atualização periódica |
| RNF5 | Acessibilidade | Contraste e legibilidade adequados (WCAG) |

---

## 4. Mapeamento para o Código Existente

O projeto atual já oferece boa base a ser **reutilizada**:

| Componente atual | Utilização na modificação |
|---|---|
| `api/src/app.js` (Express + Helmet + CORS + JSON 10kb) | Base de middlewares mantida |
| `api/src/config/conexaoBanco.js` (better-sqlite3) | Reutilizada para os novos dados |
| `api/src/rotas`, `controladores`, `utilitarios/validadores` | Padrão replicado para os novos módulos |
| `api/iniciarBanco.js` | Estendido com as novas tabelas |
| `api/src/server.js` | Mantido (porta + startup) |
| `frontend/index.html` + Tailwind + `js/app.js` | Substituir conteúdo da Landing Page pelo SPA de consulta |
| `doc/plano_landingpage_nodejs.md` | Comentários/código em PT-BR mantidos; documento arquivado |

### 4.1 Stack e Linguagens (conforme README.md)

O desenvolvimento segue exatamente a **arquitetura e as linguagens** já documentadas no `README.md` e praticadas no código atual:

**Backend (`api/`)** — Node.js **CommonJS** (`require`), **Express.js**, driver **better-sqlite3** (síncrono, prepared statements), **Helmet**, **CORS**, **Validator** (sanitização) e **Dotenv**. Camadas no padrão existente: `src/config/` (conexão `conexaoBanco.js`), `src/controladores/`, `src/rotas/`, `src/utilitarios/` (validadores) e `iniciarBanco.js` executado na subida por `src/server.js`.

**Frontend (`frontend/`)** — HTML5 semântico, **Tailwind CSS via CDN** e JavaScript **ES6+ vanilla** (Fetch API, sem frameworks).

**Convenções obrigatórias** — variáveis, funções, rotas, colunas, chaves JSON e comentários **100% em português brasileiro**; respostas padronizadas `{ sucesso, mensagem, dados }` / `{ sucesso, mensagem, erros }`; códigos HTTP semânticos (200/201/400/422/500).

**O que muda de propósito:** o sistema deixa de ser *captura de leads* e passa a ser
*consulta/análise de universidades e cursos*. A tabela `leads` pode ser removida ou reaproveitada
para *feedback/contato* (decisão a confirmar).

---

## 5. Arquitetura Proposta

```
ingressouniversidade/
├── api/                              # Backend Node.js (Express + SQLite)
│   ├── .env                          # Porta, banco, chaves de APIs externas
│   ├── package.json
│   ├── iniciarBanco.js               # DDL das novas tabelas
│   ├── src/
│   │   ├── app.js                    # Middlewares + rotas (mantido)
│   │   ├── server.js                 # Startup (mantido)
│   │   ├── config/conexaoBanco.js    # SQLite (mantido)
│   │   ├── controladores/
│   │   │   ├── buscaControlador.js        # RF1
│   │   │   ├── universidadeControlador.js # Detalhes + RF2/RF3/RF4/RF5
│   │   │   └── favoritoControlador.js     # RF6
│   │   ├── rotas/
│   │   │   ├── buscaRotas.js
│   │   │   ├── universidadeRotas.js
│   │   │   └── favoritoRotas.js
│   │   ├── servicos/
│   │   │   ├── integracaoSisu.js      # Notas de corte (API externa) — RF2
│   │   │   ├── integracaoCustoVida.js # Custos por cidade (API externa) — RF3
│   │   │   └── sincronizadorDados.js  # Atualização periódica — RNF4
│   │   └── utilitarios/validadores.js # Validação/sanitização (mantido + novos)
│   └── db/                           # SQLite (gitignore)
│
├── frontend/                         # SPA responsivo (HTML + Tailwind + JS nativo)
│   ├── index.html                    # Home: busca com filtros (RF1)
│   ├── css/estilo.css                # Contraste/legibilidade (RNF5)
│   ├── js/
│   │   ├── api.js                    # Função genérica de Fetch
│   │   ├── busca.js                  # Tela de busca e filtros
│   │   ├── detalhes.js               # Detalhes (notas, custos, bolsas, estágios)
│   │   └── favoritos.js              # Favoritos (localStorage + API)
│   ├── paginas/
│   │   ├── detalhes.html             # Detalhes da universidade/curso
│   │   └── favoritos.html            # Lista de favoritos
│   └── assets/                       # Ícones e imagens do protótipo
│
├── doc/                              # Documentação
│   ├── backup/                       # Documentos de escopo (originais)
│   └── plano_modificacao_ingressouniversidade.md  # ← Este documento
│
└── README.md                         # Atualizar para o novo escopo
```

> **Alinhamento com o README:** a hierarquia acima mantém as pastas existentes
> (`config/`, `controladores/`, `rotas/`, `utilitarios/`, `db/`). O único acréscimo
> é `src/servicos/`, que segue o mesmo padrão de nomenclatura em PT-BR para isolar
> as integrações com APIs externas (RNF4). Todos os novos arquivos usam `require`
> (CommonJS) e nomes/comentários em português.

---

## 6. Modelagem do Banco de Dados (proposta SQLite)

Assim como a tabela `leads` atual, o DDL abaixo será executado no `iniciarBanco.js`
(que roda no boot via `src/server.js`), usando a conexão de `src/config/conexaoBanco.js`
(`better-sqlite3`, `journal_mode = WAL`, `foreign_keys = ON`) e **prepared statements**
obrigatórios em todas as consultas. Nomes de tabela/colunas em PT-BR, colunas e índices
sufixados conforme o padrão do README:

```sql
-- Universidades/Instituições
CREATE TABLE IF NOT EXISTS instituicoes (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    nome   TEXT NOT NULL,
    sigla  TEXT,
    cidade TEXT NOT NULL,
    estado TEXT NOT NULL,
    site   TEXT
);

-- Cursos de cada instituição
CREATE TABLE IF NOT EXISTS cursos (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    instituicao_id     INTEGER NOT NULL REFERENCES instituicoes(id),
    nome               TEXT NOT NULL,
    grau               TEXT,                -- bacharelado, tecnólogo, licenciatura
    modalidade         TEXT,                -- presencial/EAD
    duracao_semestres  INTEGER
);

-- Notas de corte por processo seletivo (SiSU, ProUni)
CREATE TABLE IF NOT EXISTS notas_corte (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    curso_id           INTEGER NOT NULL REFERENCES cursos(id),
    modalidade_acesso  TEXT,                -- SiSU, ProUni
    ano                INTEGER NOT NULL,
    chamada            INTEGER NOT NULL,    -- 1ª chamada, chamadas posteriores
    nota_minima        REAL,
    UNIQUE(curso_id, modalidade_acesso, ano, chamada)
);

-- Custos estimados de moradia/despesas por cidade
CREATE TABLE IF NOT EXISTS custos_cidade (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    cidade         TEXT NOT NULL,
    estado         TEXT NOT NULL,
    moradia        REAL,
    alimentacao    REAL,
    transporte     REAL,
    outros         REAL,
    mes_referencia TEXT,
    UNIQUE(cidade, estado, mes_referencia)
);

-- Bolsas e auxílios oferecidos pela instituição
CREATE TABLE IF NOT EXISTS auxilios_bolsas (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    instituicao_id INTEGER NOT NULL REFERENCES instituicoes(id),
    nome           TEXT NOT NULL,
    tipo           TEXT,                -- bolsa, permanência, auxílio
    descricao      TEXT,
    url            TEXT
);

-- Indicadores de mercado e estágios por curso/região
CREATE TABLE IF NOT EXISTS mercado_estagios (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    curso_id       INTEGER NOT NULL REFERENCES cursos(id),
    regiao         TEXT,
    demanda        TEXT,                -- alta, média, baixa
    salario_medio  REAL,
    vagas_estagio  INTEGER,
    fonte          TEXT,
    atualizado_em  TEXT
);

-- Favoritos dos usuários
CREATE TABLE IF NOT EXISTS favoritos (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    sessao_usuario TEXT NOT NULL,       -- identificador anônimo
    curso_id       INTEGER REFERENCES cursos(id),
    instituicao_id INTEGER REFERENCES instituicoes(id),
    criado_em      TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(sessao_usuario, curso_id)
);

CREATE INDEX IF NOT EXISTS idx_instituicoes_nome ON instituicoes(nome);
CREATE INDEX IF NOT EXISTS idx_instituicoes_cidade ON instituicoes(cidade, estado);
CREATE INDEX IF NOT EXISTS idx_cursos_instituicao ON cursos(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_notas_curso ON notas_corte(curso_id, ano);
CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON favoritos(sessao_usuario);
```

> Observação sobre RNF4: as fontes podem ser via APIs externas (ex.: SiSU/ProUni, IBGE para custos) com
> sincronização periódica (`sincronizadorDados.js`). Na ausência de APIs abertas, os dados são
> populados por arquivos de seed e atualizados manualmente — registrado como decisão de projeto.

---

## 7. Endpoints da API (proposta)

| Método | Endpoint | Requisito | Descrição |
|---|---|---|---|
| `GET` | `/api/health` | — | Health check (mantido) |
| `GET` | `/api/instituicoes` | RF1 | Lista instituições com filtros `?cidade=&estado=&nome=` |
| `GET` | `/api/instituicoes/:id` | — | Detalhes da instituição |
| `GET` | `/api/cursos` | RF1 | Lista cursos com filtros |
| `GET` | `/api/cursos/:id` | RF1–RF5 | Detalhes do curso (notas, custos, bolsas, mercado/estágios) |
| `GET` | `/api/cursos/:id/notas-corte` | RF2 | Notas de corte (SiSU/ProUni, por chamada) |
| `GET` | `/api/cidades/:cidade/custos` | RF3 | Painel de custos estimados |
| `GET` | `/api/cursos/:id/auxilios-bolsas` | RF4 | Bolsas/auxílios da instituição |
| `GET` | `/api/cursos/:id/mercado-estagios` | RF5 | Demanda de mercado + estágios |
| `POST` | `/api/favoritos` | RF6 | Adicionar favorito |
| `GET` | `/api/favoritos` | RF6 | Listar favoritos do usuário |
| `DELETE` | `/api/favoritos/:id` | RF6 | Remover favorito |

**Convenções de resposta** (mantidas): sucesso `{ "sucesso": true, "dados": ... }`;
erro de validação com HTTP 422 e `{ "sucesso": false, "mensagem": "...", "erros": [] }`.

**Padrão de código (CommonJS/PT-BR, como `leadRotas.js` + `leadControlador.js`):**
cada módulo de rota usa `const { Router } = require('express')` e é montado em
`app.js` com `app.use('/api', ...)`; cada controlador valida via `utilitarios/validadores.js`
(`{ valido, erros, dados }` com `sanitizar()`) antes de executar prepared statements.

---

## 8. Telas do Frontend (alinhadas ao protótipo Figma)

1. **Home / Busca** — barra de busca + filtros (cidade, estado, nome) e cards de resultados (RF1).
   - Resposta em até 2 segundos com *loading* e estado vazio amigável (RNF2).
2. **Detalhes do Curso** — abas com as seções: notas de corte, custos da cidade, bolsas/auxílios,
   mercado/estágios e botão "Favoritar" (RF2–RF6).
3. **Favoritos** — lista de cursos/universidades salvos com acesso rápido (RF6).
4. **Componentes** — navbar fixa, cards, lista de tabelas e toasts de feedback (reuso do padrão atual).

**Acessibilidade (RNF5):** manter contraste de cores (WCAG AA), fontes legíveis, atributos `aria`
e navegação por teclado.

---

## 9. Segurança e Boas Práticas (mantidas)

- Prepared statements com `better-sqlite3` (anti SQL Injection).
- Sanitização/validação com `validator` (trim, escape, stripLow).
- `express.json({ limit: '10kb' })`.
- Helmet + CORS configurado.
- Favoritos anônimos identificados por sessão (sem armazenar dados pessoais).
- Código e comentários 100% em português brasileiro.

---

## 10. Fases de Execução

| Fase | Entregáveis | Requisitos |
|---|---|---|
| **1. Preparação** | Ajustar `.gitignore`, atualizar README, arquivar o plano antigo | — |
| **2. Banco de dados** | Estender `iniciarBanco.js` com as novas tabelas e seeds iniciais | RF1–RF6 |
| **3. Backend** | Controladores/rotas de busca, detalhes e favoritos + serviços de integração | RF1–RF6, RNF4 |
| **4. Frontend** | Reconstruir `index.html`, `js/` e `paginas/` conforme protótipo Figma | RF1–RF6, RNF1, RNF3, RNF5 |
| **5. Testes e integração** | Validar busca (≤2s), responsividade, acessibilidade e segurança | RNF2, RNF3, RNF5 |

---

## 11. Próximos Passos Sugeridos

1. Confirmar com o grupo a **manutenção ou remoção** da funcionalidade de leads.
2. Definir as **fontes de dados** (APIs externas ou seeds) — RNF4.
3. Escrever **histórias de usuário** seguindo o formato do exemplo da cooperativa.
4. Implementar as fases 2–5 conforme a ordem da tabela acima.

---

*Documento gerado a partir da documentação de escopo do Grupo 3 em `doc/backup/` — 10/08/2026.*
