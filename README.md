# Landing Page de Captura de Leads — Sistema Full Stack (Node.js + Express + SQLite)

> **Projeto Acadêmico:** Aplicação Full Stack moderna para captura, validação e armazenamento de *leads* em tempo real.

---

## 📋 Sobre o Projeto

Este projeto consiste em uma **Landing Page de Alta Conversão** integrada a uma **API RESTful** desenvolvida com Node.js e Express, utilizando o banco de dados leve **SQLite** para persistência de dados.

A aplicação foi desenvolvida seguindo boas práticas de arquitetura de software, validação e sanitização de dados, segurança HTTP com Helmet e navegação responsiva sem recarregamento de página (SPA-like via Fetch API).

---

## 🛠️ Tecnologias Utilizadas

### **Backend (API RESTful)**
- **Node.js** — Ambiente de execução JavaScript no servidor.
- **Express.js** — Framework web minimalista e rápido para rotas e middlewares.
- **better-sqlite3** — Driver síncrono e de alta performance para o banco SQLite.
- **Helmet** — Middleware para configuração de cabeçalhos de segurança HTTP.
- **CORS** — Habilitação de Cross-Origin Resource Sharing.
- **Validator** — Lib para sanitização e validação avançada de e-mails e textos.
- **Dotenv** — Gerenciamento de variáveis de ambiente.

### **Frontend (Interface do Usuário)**
- **HTML5 Semântico** — Marcação acessível e estruturada.
- **Tailwind CSS** — Framework CSS utilitário para design responsivo e moderno.
- **JavaScript ES6+ (Vanilla)** — Lógica do cliente, manipulação do DOM, máscaras de formulário e chamadas assíncronas via `fetch`.

---

## 📁 Estrutura do Projeto

```text
testenodejs/
├── api/                          # Servidor Backend em Node.js
│   ├── db/                       # Banco de dados SQLite (criado em runtime)
│   │   └── landing.db            # Arquivo da base de dados local
│   ├── src/
│   │   ├── config/
│   │   │   └── conexaoBanco.js   # Inicialização e conexão do SQLite
│   │   ├── controladores/
│   │   │   └── leadControlador.js# Regras de negócio da API
│   │   ├── rotas/
│   │   │   └── leadRotas.js      # Endpoints da aplicação
│   │   ├── utilitarios/
│   │   │   └── validadores.js    # Sanitização e validação dos inputs
│   │   ├── app.js                # Configuração do Express e Middlewares
│   │   └── server.js             # Inicialização da porta e servidor
│   ├── .env                      # Variáveis de ambiente
│   ├── iniciarBanco.js           # DDL de criação da tabela de leads
│   └── package.json              # Dependências e scripts do Node.js
│
├── frontend/                     # Interface Web (Landing Page)
│   ├── css/
│   │   └── estilo.css            # Estilos CSS adicionais
│   ├── js/
│   │   └── app.js                # Script client-side (máscaras e Fetch API)
│   └── index.html                # Estrutura visual da Landing Page
│
├── doc/                          # Documentação técnica do projeto
│   └── plano_landingpage_nodejs.md
│
├── .gitignore                    # Arquivos ignorados pelo Git
└── README.md                     # Documentação oficial do repositório
```

---

## 🗄️ Modelagem do Banco de Dados (SQLite)

O banco de dados SQLite é inicializado automaticamente na subida da aplicação através do script `iniciarBanco.js`.

### **Tabela `leads`**

```sql
CREATE TABLE IF NOT EXISTS leads (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_completo       TEXT    NOT NULL,
    email               TEXT    NOT NULL,
    telefone_whatsapp   TEXT    NOT NULL,
    mensagem            TEXT    DEFAULT NULL,
    data_cadastro       TEXT    DEFAULT (datetime('now','localtime')),
    status_atendimento  TEXT    DEFAULT 'novo'
                                CHECK(status_atendimento IN ('novo','contatado','convertido','perdido'))
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status_atendimento);
```

---

## 🚀 Endpoints da API

| Método | Endpoint | Descrição | Payload (Body) |
|---|---|---|---|
| `GET` | `/` | Servidor estático da Landing Page | — |
| `GET` | `/api/health` | Health Check da API | — |
| `POST` | `/api/leads` | Cadastra um novo lead | JSON (nome, email, telefone, mensagem) |
| `GET` | `/api/leads` | Lista todos os leads cadastrados | — |

### **Exemplo de Requisição `POST /api/leads`**

**Body (JSON):**
```json
{
  "nome_completo": "Maria Silva",
  "email": "maria.silva@exemplo.com",
  "telefone_whatsapp": "(11) 98888-7777",
  "mensagem": "Gostaria de agendar uma demonstração."
}
```

**Resposta de Sucesso (HTTP 201):**
```json
{
  "sucesso": true,
  "mensagem": "Lead cadastrado com sucesso!"
}
```

**Resposta de Erro de Validação (HTTP 422):**
```json
{
  "sucesso": false,
  "mensagem": "E-mail inválido.",
  "erros": [
    "Informe um endereço de e-mail válido."
  ]
}
```

---

## 🔧 Como Executar o Projeto no VS Code (Windows & Linux Ubuntu)

### **Pré-requisitos**
- **Node.js** (v18 ou superior) e **npm** instalados.
- **Git** instalado.

> 🐧 **Dica para Linux (Ubuntu/Debian):** Caso precise instalar o Node.js e Git no Ubuntu antes de abrir no VS Code:
> ```bash
> sudo apt update
> sudo apt install -y nodejs npm git
> ```

---

### 🚀 **Como Iniciar o Projeto (via Terminal do VS Code)**

1. **Abra a pasta do projeto no VS Code:**
   - Acesse o menu **Arquivo > Abrir Pasta...** (ou `File > Open Folder...` no Linux) e selecione a pasta `testenodejs`.

2. **Abra o Terminal Integrado do VS Code:**
   - Pressione o atalho **`Ctrl` + `'`** (ou `Ctrl` + `J` / `Ctrl` + `~`).
   - Ou acesse o menu superior **Terminal > Novo Terminal**.

3. **Navegue até a pasta `api` e instale as dependências (necessário na primeira execução):**
   ```bash
   cd api
   npm install
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação no navegador:**
   - **Landing Page:** [http://localhost:3000/](http://localhost:3000/)
   - **Health Check da API:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

### 🛑 **Como Parar (Stop) o Servidor**

1. **Método Padrão no VS Code (Windows & Linux Ubuntu):**
   - Com a janela do terminal integrada focada no VS Code, pressione **`Ctrl` + `C`**.
   - No Windows, se perguntado `Deseja fechar o arquivo em lote (S/N)?`, digite **`S`** e pressione **Enter**. No Linux, o processo será encerrado imediatamente.

2. **Encerrar pelo Painel de Terminais do VS Code:**
   - Clique no ícone de **Lixeira 🗑️** no canto superior direito do painel de terminais do VS Code.

3. **Liberar Porta Ocupada (caso receba o erro `EADDRINUSE: address already in use :::3000`):**
   - **No Linux (Ubuntu/Debian):**
     ```bash
     sudo fuser -k 3000/tcp
     ```
     *ou:*
     ```bash
     npx kill-port 3000
     ```
   - **No Windows (PowerShell):**
     ```powershell
     Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
     ```
   - **No Windows (CMD / Git Bash):**
     ```bash
     npx kill-port 3000
     ```

---

## 🛡️ Segurança e Boas Práticas

- **Prepared Statements:** Uso de consultas preparadas via `better-sqlite3` prevenindo ataques de **SQL Injection**.
- **Sanitização de Entradas:** Limpeza de strings com a biblioteca `validator` para evitar inserção de conteúdos maliciosos (**XSS**).
- **Proteção contra Payload Abusivo:** Middleware configurado com limite de `10kb` por requisição.
- **Respostas Padronizadas:** Tratamento transparente de erros com códigos HTTP semânticos (200, 201, 400, 422, 500).

---

## 📜 Licença e Créditos

Projeto desenvolvido para fins educacionais e acadêmicos. Sinta-se à vontade para utilizar como base para seus próprios aprendizados.
