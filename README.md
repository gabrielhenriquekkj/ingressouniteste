# Ingresso Universitario

> **Projeto Integrador I — Grupo 3**
> Integrantes: Gabriel Henrique Leal Arruda, Joao Pedro de Paula Rauh Nascimento, Italo Borges Santana e Caua Fernandes Oliveira Domingos
> Disciplina: Projeto Integrador I — Professor: Andre Lobo
> Instituicao: IFMT — Instituto Federal de Mato Grosso

---

## Sobre o Projeto

O **Ingresso Universitario** e um aplicativo web que auxilia estudantes na escolha de universidade e curso superior. O sistema reune de forma centralizada e acessivel informacoes que normalmente estao dispersas em varios sites e fontes:

- **Notas de corte** do SiSU e ProUni
- **Custos estimados** de moradia e despesas na cidade da universidade
- **Bolsas, auxilios e oportunidades** de permanencia estudantil
- **Panorama do mercado de trabalho** e demanda do curso na regiao
- **Busca por universidades e cursos** com filtros por cidade, estado e nome
- **Sistema de favoritos** para acesso rapido as opcoes de interesse

### Problema Identificado

Estudantes, especialmente de regioes como Centro-Oeste, enfrentam dificuldade para encontrar de forma clara e centralizada:

- Notas de corte dos processos seletivos
- Custo real de moradia e vida em outras cidades
- Disponibilidade de bolsas e auxilios financeiros
- Mercado de trabalho e oportunidades de estagio na regiao pretendida

### Solucao

Uma plataforma web responsiva que compila essas informacoes em um so lugar, permitindo ao estudante tomar decisoes mais informadas sobre seu ingresso na universidade.

---

## Funcionalidades

| ID  | Funcionalidade                       | Descricao |
|-----|--------------------------------------|-----------|
| RF1 | Busca de Cursos e Instituicoes      | Busca com filtros por cidade, estado e nome |
| RF2 | Exibicao de Notas de Corte          | Notas do SiSU e ProUni por ano e chamada |
| RF3 | Painel de Custos Estimados          | Moradia, alimentacao, transporte e outros |
| RF4 | Mural de Auxilios e Bolsas          | Bolsas, permanencia e auxilios da instituicao |
| RF5 | Indicador de Mercado e Estagios     | Demanda, salario medio e vagas de estagio |
| RF6 | Sistema de Favoritos                | Favoritar cursos para acesso rapido |

### Requisitos Nao Funcionais

| ID   | Requisito                    | Diretriz |
|------|------------------------------|----------|
| RNF1 | Usabilidade e Simplicidade   | Interface minimalista; informacao em ate 3 cliques |
| RNF2 | Desempenho                   | Respostas em ate 2 segundos |
| RNF3 | Responsividade               | Web app responsivo (desktop e mobile) |
| RNF4 | Confiabilidade dos Dados     | Dados de fontes/APIs com atualizacao periodica |
| RNF5 | Acessibilidade               | Contraste WCAG AA, fontes legiveis, navegacao por teclado |

---

## Stack Tecnologica

### Backend (`api/`)

| Tecnologia | Versao | Uso |
|------------|--------|-----|
| Node.js | 18+ | Runtime JavaScript |
| Express.js | 4.x | Framework web |
| better-sqlite3 | 9.x | Driver SQLite (sincrono, prepared statements) |
| Helmet | 8.x | Seguranca HTTP |
| CORS | 2.x | Cross-Origin Resource Sharing |
| Validator | 13.x | Sanitizacao de inputs |
| Dotenv | 16.x | Variaveis de ambiente |

### Frontend (`frontend/`)

| Tecnologia | Uso |
|------------|-----|
| HTML5 semantico | Estrutura das paginas |
| Tailwind CSS (CDN) | Estilizacao responsiva |
| JavaScript ES6+ vanilla | Logica e comunicacao com API (Fetch API) |

### Banco de Dados

| Caracteristica | Detalhe |
|----------------|---------|
| Motor | SQLite (better-sqlite3) |
| Modo | WAL (Write-Ahead Logging) para performance |
| Foreign Keys | Ativadas |
| Prepared Statements | Em todas as consultas (anti SQL Injection) |
| Codificacao | Nomes de tabelas e colunas em portugues brasileiro |

---

## Estrutura do Projeto

```
ingressouniversidade/
├── api/                                    # Backend Node.js
│   ├── .env                                # Variaveis de ambiente
│   ├── package.json                        # Dependencias
│   ├── iniciarBanco.js                     # DDL + dados seed
│   ├── src/
│   │   ├── app.js                          # Middlewares + rotas
│   │   ├── server.js                       # Startup do servidor
│   │   ├── config/
│   │   │   └── conexaoBanco.js             # Conexao SQLite
│   │   ├── controladores/
│   │   │   ├── buscaControlador.js         # RF1 — Busca unificada
│   │   │   ├── universidadeControlador.js  # RF2-RF5 — Detalhes
│   │   │   └── favoritoControlador.js      # RF6 — Favoritos
│   │   ├── rotas/
│   │   │   ├── buscaRotas.js               # GET /api/busca
│   │   │   ├── universidadeRotas.js        # GET /api/cursos, /api/instituicoes
│   │   │   └── favoritoRotas.js            # POST/GET/DELETE /api/favoritos
│   │   ├── servicos/
│   │   │   ├── integracaoSisu.js           # Integracao notas de corte
│   │   │   ├── integracaoCustoVida.js      # Integracao custo de vida
│   │   │   └── sincronizadorDados.js       # Atualizacao periodica
│   │   └── utilitarios/
│   │       └── validadores.js              # Validacao e sanitizacao
│   └── db/                                 # Banco SQLite (gitignore)
│
├── frontend/                               # SPA responsivo
│   ├── index.html                          # Home: busca com filtros
│   ├── css/
│   │   └── estilo.css                      # Estilos + acessibilidade
│   ├── js/
│   │   ├── api.js                          # Modulo Fetch generico
│   │   ├── busca.js                        # Logica de busca (RF1)
│   │   ├── detalhes.js                     # Detalhes do curso (RF2-RF6)
│   │   └── favoritos.js                    # Gestao de favoritos (RF6)
│   ├── paginas/
│   │   ├── detalhes.html                   # Pagina de detalhes
│   │   └── favoritos.html                  # Lista de favoritos
│   └── assets/                             # Imagens e icones
│
├── doc/                                    # Documentacao
│   ├── backup/                             # Documentos de escopo originais
│   ├── plano_modificacao_ingressouniversidade.md
│   └── plano_frontend_ingressouniversidade.md
│
└── README.md                               # Este arquivo
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

favoritos (por sessao de usuario)
```

### Descricao das Tabelas

| Tabela | Descricao |
|--------|-----------|
| `instituicoes` | Universidades/faculdades (nome, sigla, cidade, estado, site) |
| `cursos` | Cursos de cada instituicao (nome, grau, modalidade, duracao) |
| `notas_corte` | Notas minimas por processo seletivo, ano e chamada |
| `custos_cidade` | Custos estimados de moradia, alimentacao, transporte |
| `auxilios_bolsas` | Bolsas, permanencia e auxilios da instituicao |
| `mercado_estagios` | Demanda, salario medio e vagas de estagio |
| `favoritos` | Cursos salvos por sessao de usuario (anonimo) |

### Dados Seed

O sistema ja vem populado com dados iniciais para demonstracao:

- **8 instituicoes** de Mato Grosso e Mato Grosso do Sul (UFMT, UFMS, UNEMAT, IFMT, UFGD, UCDB, UNIAN, UNIC)
- **20 cursos** de diversas areas (Computacao, Engenharia, Direito, Medicina, Administracao, etc.)
- **25 registros de notas de corte** (SiSU e ProUni, 2025)
- **6 cidades** com custos estimados (Cuiaba, Campo Grande, Sinop, Dourados, etc.)
- **14 bolsas e auxilios** das instituicoes
- **18 registros de mercado e estagios**

---

## Como Executar

### Pre-requisitos

- Node.js 18 ou superior
- npm

### Instalacao e Execucao

```bash
# 1. Clonar o repositorio
git clone https://github.com/gabrielhenriquekkj/ingressouniversidade.git
cd ingressouniversidade

# 2. Instalar dependencias
cd api && npm install

# 3. Iniciar o servidor (com auto-reload)
npm run dev

# 4. Acessar no navegador
# http://localhost:3000
```

O servidor inicia automaticamente na porta 3000 (configuravel via `.env`). Na primeira execucao, o banco de dados e criado e populado com os dados seed.

---

## Endpoints da API

### Health Check

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/api/health` | Verificacao de saude da API |

### Busca (RF1)

| Metodo | Endpoint | Parametros | Descricao |
|--------|----------|------------|-----------|
| `GET` | `/api/busca` | `?nome=&cidade=&estado=` | Busca unificada de cursos e instituicoes |

### Instituicoes

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/api/instituicoes` | Lista instituicoes (filtros: nome, cidade, estado) |
| `GET` | `/api/instituicoes/:id` | Detalhes da instituicao com cursos e auxilios |

### Cursos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/api/cursos` | Lista cursos (filtros: nome, cidade, estado) |
| `GET` | `/api/cursos/:id` | Detalhes completos do curso |
| `GET` | `/api/cursos/:id/notas-corte` | Notas de corte (RF2) |
| `GET` | `/api/cidades/:cidade/custos` | Custos da cidade (RF3) |
| `GET` | `/api/cursos/:id/auxilios-bolsas` | Bolsas e auxilios (RF4) |
| `GET` | `/api/cursos/:id/mercado-estagios` | Mercado e estagios (RF5) |

### Favoritos (RF6)

| Metodo | Endpoint | Body/Parametros | Descricao |
|--------|----------|-----------------|-----------|
| `POST` | `/api/favoritos` | `{ sessao_usuario, curso_id, instituicao_id }` | Adicionar favorito |
| `GET` | `/api/favoritos` | `?sessao_usuario=` | Listar favoritos do usuario |
| `DELETE` | `/api/favoritos/:id` | `?sessao_usuario=` | Remover favorito |

### Formato de Resposta

**Sucesso:**
```json
{
  "sucesso": true,
  "mensagem": "Operacao realizada com sucesso!",
  "dados": { ... }
}
```

**Erro de validacao (HTTP 422):**
```json
{
  "sucesso": false,
  "mensagem": "Dados invalidos.",
  "erros": ["Campo obrigatorio nao preenchido."]
}
```

---

## Convencoes de Codigo

- **Linguagem:** Variaveis, funcoes, rotas, colunas do banco e comentarios em **portugues brasileiro**
- **Modulo:** CommonJS (`require` / `module.exports`)
- **Respostas HTTP:** Codigos semanticos (200, 201, 400, 404, 409, 422, 500)
- **Payload:** Limite de 10kb para JSON
- **Validacao:** Sanitizacao com `validator` (trim, escape) antes de cada operacao no banco
- **Banco:** Prepared statements em todas as consultas

---

## Seguranca

| Pratica | Implementacao |
|---------|---------------|
| SQL Injection | Prepared statements com better-sqlite3 |
| XSS | Sanitizacao com `validator` (escape) |
| Payload grande | `express.json({ limit: '10kb' })` |
| Headers HTTP | Helmet com configuracao segura |
| CORS | Configuravel via variavel `ORIGEM_PERMITIDA` |
| Dados pessoais | Favoritos anonimos por sessao (sem cadastro) |

---

## Acessibilidade (RNF5)

- Contraste de cores adequado (WCAG AA)
- Fontes legiveis com tamanhos adequados
- Atributos `aria-label` nos campos de busca
- Navegacao por teclado suportada (`focus-visible`)
- Estados de carregamento e vazio comunicados textualmente
- Feedback visual em todas as acoes (toast de sucesso/erro)

---

## Documentacao do Projeto

| Arquivo | Descricao |
|---------|-----------|
| `doc/plano_modificacao_ingressouniversidade.md` | Plano de reenquadramento do projeto |
| `doc/plano_frontend_ingressouniversidade.md` | Planejamento do frontend |
| `doc/backup/*.docx` | Documentos originais de escopo (problema, requisitos, personas) |
| `doc/backup/*.xlsx` | Pesquisa de dores dos alunos |

---

## Status do Projeto

- [x] Configuracao do banco de dados com tabelas e dados seed
- [x] Backend completo com 12 endpoints REST
- [x] Frontend responsivo com 3 paginas
- [x] Sistema de busca com filtros e debounce
- [x] Detalhes do curso com abas (notas, custos, bolsas, mercado)
- [x] Sistema de favoritos com persistencia
- [x] Documentacao atualizada
- [ ] Integracao com APIs externas (SiSU, IBGE)
- [ ] Testes automatizados
- [ ] Deploy em producao

---

## Equipe

| Nome | GitHub |
|------|--------|
| Gabriel Henrique Leal Arruda | [@gabrielhenriquekkj](https://github.com/gabrielhenriquekkj) |
| Joao Pedro de Paula Rauh Nascimento | — |
| Italo Borges Santana | — |
| Caua Fernandes Oliveira Domingos | — |

---

*Projeto Integrador I — IFMT — Grupo 3 — 2026*
