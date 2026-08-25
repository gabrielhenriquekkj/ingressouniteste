# Ingresso Universitário

> **Projeto Integrador I — Grupo 3**
> Integrantes: Gabriel Henrique Leal Arruda, João Pedro de Paula Rauh Nascimento, Italo Borges Santana e Cauã Fernandes Oliveira Domingos
> Disciplina: Projeto Integrador I — Professor: André Lôbo
> Instituição: IFMT — Instituto Federal de Mato Grosso

---

## Sobre o Projeto

O **Ingresso Universitário** é um aplicativo web que auxilia estudantes na escolha de universidade e curso superior. O sistema reúne de forma centralizada e acessível informações que normalmente estão dispersas em vários sites e fontes:

- **Notas de corte** do SiSU e ProUni
- **Custos estimados** de moradia e despesas na cidade da universidade
- **Bolsas, auxílios e oportunidades** de permanência estudantil
- **Panorama do mercado de trabalho** e demanda do curso na região
- **Busca por universidades e cursos** com filtros por cidade, estado e nome
- **Sistema de favoritos** para acesso rápido às opções de interesse

### Problema Identificado

Estudantes, especialmente de regiões como Centro-Oeste, enfrentam dificuldade para encontrar de forma clara e centralizada:

- Notas de corte dos processos seletivos
- Custo real de moradia e vida em outras cidades
- Disponibilidade de bolsas e auxílios financeiros
- Mercado de trabalho e oportunidades de estágio na região pretendida

### Solução

Uma plataforma web responsiva que compila essas informações em um só lugar, permitindo ao estudante tomar decisões mais informadas sobre seu ingresso na universidade.

---

## Funcionalidades

| ID  | Funcionalidade                       | Descrição |
|-----|--------------------------------------|-----------|
| RF1 | Busca de Cursos e Instituições      | Busca com filtros por cidade, estado e nome |
| RF2 | Exibição de Notas de Corte          | Notas do SiSU e ProUni por ano e chamada |
| RF3 | Painel de Custos Estimados          | Moradia, alimentação, transporte e outros |
| RF4 | Mural de Auxílios e Bolsas          | Bolsas, permanência e auxílios da instituição |
| RF5 | Indicador de Mercado e Estágios     | Demanda, salário médio e vagas de estágio |
| RF6 | Sistema de Favoritos                | Favoritar cursos para acesso rápido |

### Requisitos Não Funcionais

| ID   | Requisito                    | Diretriz |
|------|------------------------------|----------|
| RNF1 | Usabilidade e Simplicidade   | Interface minimalista; informação em até 3 cliques |
| RNF2 | Desempenho                   | Respostas em até 2 segundos |
| RNF3 | Responsividade               | Web app responsivo (desktop e mobile) |
| RNF4 | Confiabilidade dos Dados     | Dados de fontes/APIs com atualização periódica |
| RNF5 | Acessibilidade               | Contraste WCAG AA, fontes legíveis, navegação por teclado |

---

## Arquitetura do Sistema

O projeto segue o padrão **MVC (Model-View-Controller)** com nomenclatura em português brasileiro, aplicando princípios **SOLID** e *Clean Architecture*.

### Fluxo de Requisição

```
Requisição HTTP
    │
    ▼
┌──────────────────────────────────┐
│  app.js                          │
│  ├── Helmet (segurança)          │
│  ├── CORS                        │
│  ├── JSON Parser (10kb limit)    │
│  ├── Logger (intermediários/)    │
│  ├── Static Files (frontend/)    │
│  └── Rotas (rotas/)              │
│        │                         │
│        ▼                         │
│  Controladores (controladores/)  │
│        │                         │
│        ├── Valida (utilitários/) │
│        │                         │
│        ├── Chama Modelo          │
│        │     │                   │
│        │     ▼                   │
│        │  Modelos (modelos/)     │
│        │     │                   │
│        │     ▼                   │
│        │  conexaoBanco           │
│        │  (configurações/)       │
│        │     │                   │
│        │     ▼                   │
│        │  SQLite DB              │
│        │                         │
│        └── Retorna Response      │
│                                  │
│  tratamentoErros ←── erros via next(erro)
└──────────────────────────────────┘
```

### Camadas

| Camada | Diretório | Responsabilidade |
|--------|-----------|------------------|
| **Configurações** | `configuracoes/` | Conexão com banco de dados, variáveis de ambiente |
| **Modelos** | `modelos/` | Lógica de acesso a dados, queries SQL, regras de domínio |
| **Controladores** | `controladores/` | Intermediação HTTP, validação de input, comunicação entre camadas |
| **Intermediários** | `intermediarios/` | Middlewares Express (logger, tratamento de erros) |
| **Rotas** | `rotas/` | Definição de endpoints e mapeamento para controladores |
| **Serviços** | `servicos/` | Orquestração de modelos, integração com fontes externas |
| **Utilitários** | `utilitarios/` | Funções de validação e sanitização |
| **Visões** | `frontend/` | Interface HTML + JavaScript estático |

### Princípios Aplicados

- **Separação de Responsabilidades (SRP):** Cada camada tem uma única responsabilidade
- **Baixo Acoplamento:** Controladores dependem de modelos, não do banco diretamente
- **Tratamento de Erros Centralizado:** Middleware global via `next(erro)`
- **DRY:** Queries SQL extraídas para modelos reutilizáveis
- **Prepared Statements:** Todas as consultas usam parâmetros preparados (anti SQL Injection)

---

## Stack Tecnológica

### Backend (`api/`)

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | 18+ | Runtime JavaScript |
| Express.js | 4.x | Framework web |
| better-sqlite3 | 9.x | Driver SQLite (síncrono, prepared statements) |
| Helmet | 8.x | Segurança HTTP |
| CORS | 2.x | Cross-Origin Resource Sharing |
| Validator | 13.x | Sanitização de inputs |
| Dotenv | 16.x | Variáveis de ambiente |

### Frontend (`frontend/`)

| Tecnologia | Uso |
|------------|-----|
| HTML5 semântico | Estrutura das páginas |
| Tailwind CSS (CDN) | Estilização responsiva |
| JavaScript ES6+ vanilla | Lógica e comunicação com API (Fetch API) |

### Banco de Dados

| Característica | Detalhe |
|----------------|---------|
| Motor | SQLite (better-sqlite3) |
| Modo | WAL (Write-Ahead Logging) para performance |
| Foreign Keys | Ativadas |
| Prepared Statements | Em todas as consultas (anti SQL Injection) |
| Codificação | Nomes de tabelas e colunas em português brasileiro |

---

## Estrutura do Projeto

```
ingressouniversidade/
├── api/                                        # Backend Node.js
│   ├── .env                                    # Variáveis de ambiente
│   ├── package.json                            # Dependências
│   ├── iniciarBanco.js                         # DDL + dados seed
│   ├── src/
│   │   ├── app.js                              # Middlewares + rotas + tratamento de erros
│   │   ├── server.js                           # Startup do servidor
│   │   │
│   │   ├── configuracoes/                      # Configurações do sistema
│   │   │   └── conexaoBanco.js                 # Conexão SQLite (WAL, FK)
│   │   │
│   │   ├── modelos/                            # Camada de acesso a dados (MVC - M)
│   │   │   ├── instituicaoModelo.js            # Consultas de instituições
│   │   │   ├── cursoModelo.js                  # Consultas de cursos
│   │   │   ├── notaCorteModelo.js              # Consultas de notas de corte
│   │   │   ├── custoCidadeModelo.js            # Consultas de custos por cidade
│   │   │   ├── auxilioBolsaModelo.js           # Consultas de auxílios e bolsas
│   │   │   ├── mercadoEstagioModelo.js         # Consultas de mercado e estágios
│   │   │   └── favoritoModelo.js               # CRUD de favoritos
│   │   │
│   │   ├── controladores/                      # Lógica de HTTP (MVC - C)
│   │   │   ├── buscaControlador.js             # RF1 — Busca unificada
│   │   │   ├── universidadeControlador.js      # RF2-RF5 — Detalhes
│   │   │   └── favoritoControlador.js          # RF6 — Favoritos
│   │   │
│   │   ├── intermediarios/                     # Middlewares Express
│   │   │   ├── tratamentoErros.js              # Handler global de erros
│   │   │   └── logger.js                       # Log de requisições (method, url, status, ms)
│   │   │
│   │   ├── rotas/                              # Definição de endpoints
│   │   │   ├── buscaRotas.js                   # GET /api/busca
│   │   │   ├── universidadeRotas.js            # GET /api/cursos, /api/instituicoes
│   │   │   └── favoritoRotas.js                # POST/GET/DELETE /api/favoritos
│   │   │
│   │   ├── servicos/                           # Orquestração e integração
│   │   │   ├── integracaoSisu.js               # Integração notas de corte
│   │   │   └── integracaoCustoVida.js          # Integração custo de vida
│   │   │
│   │   └── utilitarios/                        # Funções auxiliares
│   │       └── validadores.js                  # Validação e sanitização (validator)
│   │
│   └── db/                                     # Banco SQLite (gitignore)
│
├── frontend/                                   # Visões estáticas (MVC - V)
│   ├── index.html                              # Home: busca com filtros
│   ├── css/
│   │   └── estilo.css                          # Estilos + acessibilidade
│   ├── js/
│   │   ├── api.js                              # Módulo Fetch genérico
│   │   ├── busca.js                            # Lógica de busca (RF1)
│   │   ├── detalhes.js                         # Detalhes do curso (RF2-RF5)
│   │   ├── favoritos.js                        # Gestão de favoritos (RF6)
│   │   ├── componentes.js                      # Componentes de UI reutilizáveis
│   │   ├── dadosDemo.js                        # Dados de demonstração (fallback)
│   │   └── util.js                             # Funções utilitárias
│   ├── paginas/
│   │   ├── detalhes.html                       # Página de detalhes
│   │   └── favoritos.html                      # Lista de favoritos
│   └── assets/                                 # Imagens e ícones
│
├── doc/                                        # Documentação
│   ├── reestruturacao.md                       # Plano de reestruturação MVC
│   ├── prompt_mvc_deepseek_v2.md               # Prompt de reestruturação
│   └── backup/                                 # Documentos originais de escopo
│
└── README.md                                   # Este arquivo
```

---

## Modelo de Banco de Dados

### Tabelas

```
instituicoes ──< cursos ──< notas_corte
                  │
                  ├──< mercado_estagios
                  │
instituicoes ──< auxilios_bolsas

custos_cidade (por cidade)

favoritos (por sessão de usuário)
```

### Descrição das Tabelas

| Tabela | Colunas Principais | Descrição |
|--------|-------------------|-----------|
| `instituicoes` | id, nome, sigla, cidade, estado, site | Universidades/faculdades |
| `cursos` | id, instituicao_id, nome, grau, modalidade, duracao_semestres | Cursos de cada instituição |
| `notas_corte` | id, curso_id, modalidade_acesso, ano, chamada, nota_minima | Notas mínimas por processo seletivo |
| `custos_cidade` | id, cidade, estado, moradia, alimentacao, transporte, outros, mes_referencia | Custos estimados por cidade |
| `auxilios_bolsas` | id, instituicao_id, nome, tipo, descricao, url | Bolsas e auxílios da instituição |
| `mercado_estagios` | id, curso_id, regiao, demanda, salario_medio, vagas_estagio, fonte, atualizado_em | Demanda e estágios |
| `favoritos` | id, sessao_usuario, curso_id, instituicao_id, criado_em | Cursos salvos por sessão |

### Índices

```sql
idx_instituicoes_nome    -- Busca por nome da instituição
idx_instituicoes_cidade  -- Busca por cidade/estado
idx_cursos_instituicao   -- Cursos por instituição
idx_notas_curso          -- Notas de corte por curso/ano
idx_favoritos_usuario    -- Favoritos por sessão de usuário
```

### Dados Seed

O sistema já vem populado com dados iniciais para demonstração:

- **8 instituições** de Mato Grosso e Mato Grosso do Sul (UFMT, UFMS, UNEMAT, IFMT, UFGD, UCDB, UNIAN, UNIC)
- **20 cursos** de diversas áreas (Computação, Engenharia, Direito, Medicina, Administração, etc.)
- **25 registros de notas de corte** (SiSU e ProUni, 2025)
- **6 cidades** com custos estimados (Cuiabá, Campo Grande, Sinop, Dourados, Rondonópolis, Tangará da Serra)
- **14 bolsas e auxílios** das instituições
- **18 registros de mercado e estágios**

---

## Como Executar

### Pré-requisitos

- Node.js 18 ou superior
- npm

### Instalação e Execução

```bash
# 1. Clonar o repositório
git clone https://github.com/gabrielhenriquekkj/ingressouniversidade.git
cd ingressouniversidade

# 2. Instalar dependências
cd api && npm install

# 3. Iniciar o servidor (com auto-reload)
npm run dev

# 4. Acessar no navegador
# http://localhost:3000
```

O servidor inicia automaticamente na porta 3000 (configurável via `.env`). Na primeira execução, o banco de dados é criado e populado com os dados seed.

### Variáveis de Ambiente

| Variável | Valor Padrão | Descrição |
|----------|--------------|-----------|
| `PORT` | `3000` | Porta do servidor |
| `ORIGEM_PERMITIDA` | `*` | Origens permitidas (CORS) |

---

## Endpoints da API

### Health Check

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/health` | Verificação de saúde da API |

### Busca (RF1)

| Método | Endpoint | Parâmetros | Descrição |
|--------|----------|------------|-----------|
| `GET` | `/api/busca` | `?nome=&cidade=&estado=` | Busca unificada de cursos e instituições |

### Instituições

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/instituicoes` | Lista instituições (filtros: nome, cidade, estado) |
| `GET` | `/api/instituicoes/:id` | Detalhes da instituição com cursos e auxílios |

### Cursos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/cursos` | Lista cursos (filtros: nome, cidade, estado) |
| `GET` | `/api/cursos/:id` | Detalhes completos do curso (notas, custos, bolsas, mercado) |
| `GET` | `/api/cursos/:id/notas-corte` | Notas de corte do curso (RF2) |
| `GET` | `/api/cursos/:id/auxilios-bolsas` | Bolsas e auxílios da instituição (RF4) |
| `GET` | `/api/cursos/:id/mercado-estagios` | Mercado de trabalho e estágios (RF5) |
| `GET` | `/api/cidades/:cidade/custos` | Custos de vida da cidade (RF3) |

### Favoritos (RF6)

| Método | Endpoint | Body/Parâmetros | Descrição |
|--------|----------|-----------------|-----------|
| `POST` | `/api/favoritos` | `{ sessao_usuario, curso_id, instituicao_id }` | Adicionar favorito |
| `GET` | `/api/favoritos` | `?sessao_usuario=` | Listar favoritos do usuário |
| `DELETE` | `/api/favoritos/:id` | `?sessao_usuario=` | Remover favorito |

**Total: 13 endpoints**

### Formato de Resposta

**Sucesso:**
```json
{
  "sucesso": true,
  "mensagem": "Operação realizada com sucesso!",
  "dados": { ... }
}
```

**Erro de validação (HTTP 422):**
```json
{
  "sucesso": false,
  "mensagem": "Dados inválidos.",
  "erros": ["Campo obrigatório não preenchido."]
}
```

**Erro genérico (HTTP 400/404/500):**
```json
{
  "sucesso": false,
  "mensagem": "Descrição do erro."
}
```

---

## Frontend

### Páginas

| Página | Arquivo | Descrição |
|--------|---------|-----------|
| Home / Busca | `index.html` | Busca com filtros e grid de resultados (RF1) |
| Detalhes | `paginas/detalhes.html` | Detalhes do curso com abas (RF2-RF5) |
| Favoritos | `paginas/favoritos.html` | Lista de cursos favoritados (RF6) |

### Fluxo de Navegação

```
             ┌───────────┐
             │  index    │  busca + filtros (RF1)
             └─────┬─────┘
                   │ click num card
             ┌─────▼─────┐
             │ detalhes  │  ?id=<curso> (RF2–RF5) + "Favoritar" (RF6)
             └─────┬─────┘
                   │ navbar → Favoritos
             ┌─────▼─────┐
             │ favoritos │  lista salva (RF6)
             └───────────┘
```

### Componentes Reutilizáveis (`js/componentes.js`)

| Componente | Descrição |
|------------|-----------|
| `cardResultado(curso)` | Card da busca com highlight de nota mínima |
| `botaoFavorito(curso, grande)` | Botão de favoritar/desfavoritar |
| `tabelaNotas(notas)` | Tabela responsiva de notas de corte |
| `listaAuxilios(auxilios)` | Lista de bolsas/auxílios com link externo |
| `cardInfo(icone, titulo, valor, destaque)` | Card de indicador (custos, demanda) |
| `badge(texto, classes)` | Rótulos de demanda/seguro |

### Funções Utilitárias (`js/util.js`)

| Função | Descrição |
|--------|-----------|
| `escapeHTML(texto)` | Escapa caracteres especiais (anti XSS) |
| `gerarUUID()` | Gera UUID para sessão de usuário |
| `debounce(func, atraso)` | Controle de frequência de chamadas |
| `toast(mensagem, tipo)` | Feedback visual de sucesso/erro |
| `formatarMoeda(valor)` | Formata valor em R$ |
| `skeleton(quantidade)` | Placeholder de carregamento |
| `estadoVazio(mensagem)` | Estado de ausência de dados |
| `estadoErro(mensagem)` | Estado de erro |

---

## Convencões de Código

- **Linguagem:** Variáveis, funções, rotas, colunas do banco e comentários em **português brasileiro**
- **Módulo:** CommonJS (`require` / `module.exports`)
- **Respostas HTTP:** Códigos semânticos (200, 201, 400, 404, 409, 422, 500)
- **Payload:** Limite de 10kb para JSON
- **Validação:** Sanitização com `validator` (trim, escape) antes de cada operação no banco
- **Banco:** Prepared statements em todas as consultas

### Padrões de Código

**Modelo** — retorna dados puros (objetos/arrays):
```javascript
const banco = require('../configuracoes/conexaoBanco')

function listar() {
  return banco.prepare('SELECT * FROM tabela').all()
}

function detalhar(id) {
  return banco.prepare('SELECT * FROM tabela WHERE id = ?').get(id)
}

module.exports = { listar, detalhar }
```

**Controlador** — intermedia HTTP, delega ao modelo:
```javascript
const modelo = require('../modelos/entidadeModelo')

function listar(req, res, next) {
  try {
    const dados = modelo.listar()
    res.json({ sucesso: true, dados })
  } catch (erro) {
    next(erro)
  }
}

module.exports = { listar }
```

---

## Segurança

| Prática | Implementação |
|---------|---------------|
| SQL Injection | Prepared statements com better-sqlite3 |
| XSS | Sanitização com `validator` (escape) |
| Payload grande | `express.json({ limit: '10kb' })` |
| Headers HTTP | Helmet com configuração segura |
| CORS | Configurável via variável `ORIGEM_PERMITIDA` |
| Dados pessoais | Favoritos anônimos por sessão (sem cadastro) |
| Tratamento de erros | Middleware global que retorna JSON (não expõe stack traces) |
| Logging | Middleware de log registra method, url, status e duração |

---

## Acessibilidade (RNF5)

- Contraste de cores adequado (WCAG AA)
- Fontes legíveis com tamanhos adequados
- Atributos `aria-label` nos campos de busca
- Navegação por teclado suportada (`focus-visible`)
- Estados de carregamento e vazio comunicados textualmente
- Feedback visual em todas as ações (toast de sucesso/erro)
- Abas com navegação por setas (`ArrowRight`, `ArrowLeft`)

---

## Documentação do Projeto

| Arquivo | Descrição |
|---------|-----------|
| `doc/reestruturacao.md` | Plano detalhado de reestruturação para MVC |
| `doc/prompt_mvc_deepseek_v2.md` | Prompt de reestruturação arquitetural |
| `doc/backup/` | Documentos originais de escopo (problema, requisitos, personas, pesquisas) |

---

## Status do Projeto

- [x] Configuração do banco de dados com tabelas e dados seed
- [x] Backend com 13 endpoints REST (arquitetura MVC)
- [x] Camada de Modelos com 7 arquivos (desacoplamento do banco)
- [x] Middleware global de tratamento de erros
- [x] Middleware de log de requisições
- [x] Serviços de integração reescritos (orquestram modelos)
- [x] Frontend responsivo com 3 páginas
- [x] Sistema de busca com filtros e debounce
- [x] Detalhes do curso com abas (notas, custos, bolsas, mercado)
- [x] Sistema de favoritos com persistência (localStorage + API)
- [x] Componentes de UI reutilizáveis
- [x] Dados de demonstração (fallback)
- [ ] Integração com APIs externas (SiSU, IBGE)
- [ ] Testes automatizados
- [ ] Deploy em produção

---

## Equipe

| Nome | GitHub |
|------|--------|
| Gabriel Henrique Leal Arruda | [@gabrielhenriquekkj](https://github.com/gabrielhenriquekkj) |
| João Pedro de Paula Rauh Nascimento | — |
| Italo Borges Santana | — |
| Cauã Fernandes Oliveira Domingos | — |

---

*Projeto Integrador I — IFMT — Grupo 3 — 2026*
