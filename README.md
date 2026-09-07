# Ingresso Universitário

> **Projeto Integrador I — Grupo 3**
> Integrantes: Gabriel Henrique Leal Arruda, João Pedro de Paula Rauh Nascimento, Italo Borges Santana e Cauã Fernandes Oliveira Domingos
> Disciplina: Projeto Integrador I — Professor: André Lôbo
> Instituição: IFMT — Instituto Federal de Mato Grosso

---

## Sobre o Projeto

O **Ingresso Universitário** é um aplicativo web que auxilia estudantes na escolha de universidade e curso superior. O sistema reúne de forma centralizada e acessível informações que normalmente estão dispersas em vários sites e fontes:

- **Notas de corte** do SiSU 2026 (obtidas de arquivo CSV baixado do site oficial do MEC)
- **Busca por universidades e cursos** com filtros por estado e categoria
- **Sistema de favoritos** para acesso rápido às opções de interesse
- **Autocomplete** no campo de busca com sugestões clicáveis

### Problema Identificado

Estudantes, especialmente de regiões como Centro-Oeste, enfrentam dificuldade para encontrar de forma clara e centralizada:

- Notas de corte dos processos seletivos
- Informações sobre cursos e universidades em um só lugar

### Solução

Uma plataforma web responsiva que compila essas informações em um só lugar, permitindo ao estudante tomar decisões mais informadas sobre seu ingresso na universidade.

---

## Funcionalidades

| ID  | Funcionalidade                       | Status | Descrição |
|-----|--------------------------------------|--------|-----------|
| RF1 | Busca de Cursos e Instituições      | ✅ Funcional | Busca com filtros por estado, categoria e nome |
| RF1b | Autocomplete no campo de busca     | ✅ Funcional | Sugestões clicáveis de cursos e instituições |
| RF2 | Exibição de Notas de Corte          | ✅ Funcional | Notas do SiSU 2026 por modalidade de acesso |
| RF3 | Painel de Custos Estimados          | ❌ Não implementado | Requer dados do IBGE PIB per capita |
| RF4 | Mural de Auxílios e Bolsas          | ⚠️ Parcial | Dados disponíveis mas sem coleta automatizada |
| RF5 | Indicador de Mercado e Estágios     | ⚠️ Parcial | Dados limitados sem coleta automatizada |
| RF6 | Sistema de Favoritos                | ✅ Funcional | Favoritar cursos para acesso rápido |

### Requisitos Não Funcionais

| ID   | Requisito                    | Status | Observação |
|------|------------------------------|--------|------------|
| RNF1 | Usabilidade e Simplicidade   | ✅ | Interface minimalista |
| RNF2 | Desempenho                   | ✅ | Respostas rápidas via SQLite |
| RNF3 | Responsividade               | ✅ | Web app responsivo (Tailwind CSS) |
| RNF4 | Confiabilidade dos Dados     | ⚠️ | Dados do SiSU 2026; outras fontes incompletas |
| RNF5 | Acessibilidade               | ✅ | Contraste adequado, navegação por teclado |

---

## Fontes de Dados

### Dados Atualmente no Sistema

| Categoria | Quantidade | Fonte | Status |
|-----------|------------|-------|--------|
| Instituições | 136 | SiSU 2026 (arquivo CSV baixado) + EMEC/MEC (CSV GitHub) | ✅ Dados reais |
| Cursos | 4.837 | SiSU 2026 (arquivo CSV baixado) + INEP (parcial) | ✅ Dados reais |
| Notas de corte | 30.995 | SiSU 2026 (arquivo CSV baixado do MEC) | ✅ Dados oficiais |
| Cursos com notas | 4.590 | SiSU 2026 (arquivo CSV baixado do MEC) | ✅ 95% dos cursos |
| Auxílios/Bolsas | 571 | Dados abertos MEC | ⚠️ Dados limitados |
| Mercado de trabalho | 3.332 | Estimativas | ⚠️ Dados incompletos |

### Detalhamento das Fontes

#### 1. SiSU 2026 (Dados Oficiais MEC)
- **Status:** ✅ Implementado e funcional
- **Dados:** Notas de corte por curso, modalidade de acesso e ano
- **Origem:** Arquivo CSV baixado manualmente do site oficial do MEC/SiSU
- **Arquivo:** `doc/Sisu2026.csv.csv` (62.567 registros, delimitador `;`, codificação latin1)
- **Importação:** Script `api/src/cli/importarSisu2026.js` (importação manual, não automatizada)
- **Observação:** Não é mineração de dados. O arquivo foi disponibilizado pelo MEC e importado via script sob demanda.

#### 2. EMEC/MEC (Lista de Instituições)
- **Status:** ✅ Implementado
- **Dados:** Lista de instituições públicas ativas
- **Origem:** Arquivo CSV baixado do GitHub (gustavofidelisc/BrasilUniversidades)
- **Observação:** 78 instituições públicas federais e estaduais. Dados coletados de fonte secundária.

#### 3. INEP Microdados (Cursos e Campi)
- **Status:** ❌ Não implementado
- **Dados necessários:** Cursos, campi e detalhes das instituições
- **Problema:** Arquivos de microdados não encontrados no diretório `api/temp/microdados_2023/`
- **Consequência:** Não foi possível vincular automaticamente os cursos com suas instituições via INEP
- **Solução aplicada:** Cursos foram importados a partir do arquivo SiSU 2026 (que contém código da instituição e do curso)

#### 4. IBGE PIB per capita (Custos de Vida)
- **Status:** ❌ Não implementado
- **Dados necessários:** Moradia, alimentação, transporte por município
- **Problema:** Requer coleta e processamento de dados do IBGE
- **Impacto:** Aba "Custos da cidade" mostra mensagem de dados indisponíveis

#### 5. Dados Abertos MEC (Auxílios e Bolsas)
- **Status:** ⚠️ Parcialmente implementado
- **Dados:** 571 registros de auxílios e bolsas
- **Problema:** Coleta não automatizada, dados limitados
- **Impacto:** Aba "Bolsas e auxílios" mostra poucos resultados

#### 6. Mercado de Trabalho
- **Status:** ⚠️ Parcialmente implementado
- **Dados:** 3.332 registros com demanda estimada
- **Problema:** Dados baseados em estimativas, não em dados oficiais
- **Impacto:** Aba "Mercado e estágios" mostra informações limitadas

---

## O que está Funcional e o que Não Está

### ✅ Funcional

1. **Busca de cursos e instituições**
   - Filtros por estado, categoria e nome
   - Autocomplete com sugestões clicáveis
   - Paginação de resultados

2. **Notas de corte do SiSU 2026**
   - 30.995 notas reais importadas
   - Exibição por modalidade de acesso
   - Dados oficiais do MEC

3. **Detalhes do curso**
   - Informações básicas (nome, grau, turno, cidade)
   - Notas de corte disponíveis na aba correspondente

4. **Sistema de favoritos**
   - Adicionar/remover cursos favoritos
   - Persistência em localStorage
   - Acesso rápido pela navbar

5. **Interface responsiva**
   - Layout adaptável para desktop e mobile
   - Componentes de UI reutilizáveis
   - Estados de carregamento e erro

### ❌ Não Funcional (ou parcialmente)

1. **Custos de vida por cidade (RF3)**
   - **Motivo:** Requer dados do IBGE PIB per capita por município
   - **Solução necessária:** Implementar coletor de dados do IBGE ou usar API do IBGE
   - **Estado atual:** Aba mostra "Indicadores econômicos ainda não disponíveis"

2. **Auxílios e bolsas completos (RF4)**
   - **Motivo:** Coleta não automatizada, dados limitados a 571 registros
   - **Solução necessária:** Implementar coletor de dados do MEC ou usar API do Programa Universidade
   - **Estado atual:** Aba mostra poucos resultados para a maioria das instituições

3. **Mercado de trabalho e estágios (RF5)**
   - **Motivo:** Requer dados de mercado de trabalho por região e curso
   - **Solução necessária:** Integração com APIs de mercado de trabalho (e.g., InfoJobs, LinkedIn)
   - **Estado atual:** Dados baseados em estimativas, não em dados oficiais

---

## Arquitetura do Sistema

O projeto segue o padrão **MVC (Model-View-Controller)** com nomenclatura em português brasileiro.

### Estrutura de Diretórios

```
ingressouniversidade/
├── api/                                        # Backend Node.js
│   ├── src/
│   │   ├── app.js                              # Middlewares + rotas
│   │   ├── server.js                           # Startup do servidor
│   │   ├── configuracoes/                      # Configurações
│   │   ├── modelos/                            # Acesso a dados (MVC - M)
│   │   ├── controladores/                      # Lógica HTTP (MVC - C)
│   │   ├── rotas/                              # Endpoints
│   │   ├── mineracao/                          # Sistema de mineração
│   │   └── cli/                                # Scripts de linha de comando
│   └── db/                                     # Banco SQLite
│
├── frontend/                                   # Interface (MVC - V)
│   ├── index.html                              # Home: busca com filtros
│   ├── css/estilo.css                          # Estilos
│   ├── js/                                     # Lógica JavaScript
│   └── paginas/                                # Páginas internas
│
└── doc/                                        # Documentação
```

---

## Stack Tecnológica

### Backend (`api/`)

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | 18+ | Runtime JavaScript |
| Express.js | 4.x | Framework web |
| better-sqlite3 | 13.x | Driver SQLite |
| Helmet | 8.x | Segurança HTTP |
| CORS | 2.x | Cross-Origin Resource Sharing |
| Validator | 13.x | Sanitização de inputs |
| Dotenv | 16.x | Variáveis de ambiente |
| Axios | 1.x | HTTP client |
| Cheerio | 1.x | Parseamento HTML |
| node-cron | 3.x | Agendamento de tarefas |

### Frontend (`frontend/`)

| Tecnologia | Uso |
|------------|-----|
| HTML5 semântico | Estrutura das páginas |
| Tailwind CSS (CDN) | Estilização responsiva |
| JavaScript ES6+ vanilla | Lógica e comunicação com API |

### Banco de Dados

| Característica | Detalhe |
|----------------|---------|
| Motor | SQLite (better-sqlite3) |
| Modo | WAL (Write-Ahead Logging) |
| Foreign Keys | Ativadas |
| Prepared Statements | Em todas as consultas |

---

## Endpoints da API

### Busca e Sugestões

| Método | Endpoint | Parâmetros | Descrição |
|--------|----------|------------|-----------|
| `GET` | `/api/busca` | `?q=&estado=&categoria=` | Busca unificada |
| `GET` | `/api/sugestoes` | `?q=&limite=` | Sugestões para autocomplete |

### Instituições e Cursos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/instituicoes` | Lista instituições |
| `GET` | `/api/instituicoes/:id` | Detalhes da instituição |
| `GET` | `/api/cursos` | Lista cursos |
| `GET` | `/api/cursos/:id` | Detalhes do curso (com notas de corte) |

### Favoritos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/favoritos` | Adicionar favorito |
| `GET` | `/api/favoritos` | Listar favoritos |
| `DELETE` | `/api/favoritos/:id` | Remover favorito |

### Health Check

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/health` | Verificação de saúde |

**Total: 11 endpoints**

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

# 3. Importar os dados do SiSU 2026 (obrigatório na primeira vez)
node src/cli/importarSisu2026.js

# 4. Iniciar o servidor
npm start

# 5. Acessar no navegador
# http://localhost:3000
```

### Variáveis de Ambiente

| Variável | Valor Padrão | Descrição |
|----------|--------------|-----------|
| `PORT` | `3000` | Porta do servidor |
| `ORIGEM_PERMITIDA` | `*` | Origens permitidas (CORS) |
| `MINERACAO_ENABLED` | `false` | Ativar mineração automática |

---

## Banco de Dados

### Tabelas Principais

```
instituicoes ──< cursos ──< notas_corte
                  │
                  ├──< mercado_estagios
                  │
instituicoes ──< auxilios_bolsas

favoritos (por sessão de usuário)
```

### Dados Atuais

| Tabela | Registros | Descrição |
|--------|-----------|-----------|
| `instituicoes` | 136 | Universidades e faculdades |
| `cursos` | 4.837 | Cursos de graduação |
| `notas_corte` | 30.995 | Notas do SiSU 2026 |
| `auxilios_bolsas` | 571 | Bolsas e auxílios |
| `mercado_estagios` | 3.332 | Dados de mercado |
| `favoritos` | 0 | Cursos favoritados (por sessão) |

---

## Segurança

| Prática | Implementação |
|---------|---------------|
| SQL Injection | Prepared statements com better-sqlite3 |
| XSS | Sanitização com `validator` |
| Payload grande | `express.json({ limit: '10kb' })` |
| Headers HTTP | Helmet com configuração segura |
| CORS | Configurável via variável `ORIGEM_PERMITIDA` |
| Dados pessoais | Favoritos anônimos por sessão |

---

## Acessibilidade

- Contraste de cores adequado (WCAG AA)
- Fontes legíveis com tamanhos adequados
- Atributos `aria-label` nos campos de busca
- Navegação por teclado suportada
- Estados de carregamento e vazio comunicados textualmente
- Abas com navegação por setas

---

## Limitações Conhecidas

1. **Dados de custos de vida não disponíveis**
   - Requer implementação de coletor IBGE
   - Solução: Integrar API do IBGE ou usar dados abertos

2. **Auxílios e bolsas limitados**
   - Apenas 571 registros disponíveis
   - Solução: Implementar coletor do MEC ou API do Programa Universidade

3. **Dados de mercado incompletos**
   - Baseados em estimativas, não em dados oficiais
   - Solução: Integrar APIs de mercado de trabalho

4. **Instituições particulares não incluídas**
   - Sistema focado em instituições públicas
   - Solução: Expandir coleta para incluir particulares

5. **Notas de corte apenas do SiSU 2026**
   - Dados de anos anteriores não disponíveis
   - Solução: Implementar histórico de notas

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
