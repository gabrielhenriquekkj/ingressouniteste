const banco = require('../src/configuracoes/conexaoBanco')

function tabelaExiste(tabela) {
  const resultado = banco.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
  ).get(tabela)
  return Boolean(resultado)
}

function colunaExiste(tabela, coluna) {
  return banco.prepare(`PRAGMA table_info(${tabela})`).all().some(item => item.name === coluna)
}

function executar() {
  console.log('=== Migração 003: Área Administrativa ===')

  banco.exec(`
    CREATE TABLE IF NOT EXISTS admin_usuarios (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      nome           TEXT NOT NULL,
      email          TEXT NOT NULL UNIQUE COLLATE NOCASE,
      senha_hash     TEXT NOT NULL,
      role           TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'editor')),
      ativo          INTEGER NOT NULL DEFAULT 1,
      criado_em      TEXT NOT NULL,
      ultimo_login   TEXT,
      tentativas     INTEGER NOT NULL DEFAULT 0,
      bloqueado_ate  TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_sessoes (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      token_hash   TEXT NOT NULL UNIQUE,
      csrf_token   TEXT NOT NULL,
      usuario_id   INTEGER NOT NULL REFERENCES admin_usuarios(id) ON DELETE CASCADE,
      ip_hash      TEXT NOT NULL,
      user_agent   TEXT NOT NULL DEFAULT '',
      criado_em    TEXT NOT NULL,
      expira_em    TEXT NOT NULL,
      revogado_em  TEXT
    );

    CREATE TABLE IF NOT EXISTS acessos (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      rota         TEXT NOT NULL,
      metodo       TEXT NOT NULL DEFAULT 'GET',
      criado_em    TEXT NOT NULL,
      dia          TEXT NOT NULL,
      dispositivo  TEXT NOT NULL,
      navegador    TEXT NOT NULL,
      sistema      TEXT NOT NULL,
      ip_hash      TEXT NOT NULL,
      status       INTEGER,
      area         TEXT NOT NULL DEFAULT 'publico',
      detalhes     TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS relatorios (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      nome            TEXT NOT NULL,
      formato         TEXT NOT NULL,
      filtros         TEXT NOT NULL,
      resumo          TEXT NOT NULL,
      dados           TEXT NOT NULL,
      total_registros INTEGER NOT NULL,
      criado_em       TEXT NOT NULL,
      usuario_id      INTEGER REFERENCES admin_usuarios(id)
    );

    CREATE INDEX IF NOT EXISTS idx_acessos_dia ON acessos(dia);
    CREATE INDEX IF NOT EXISTS idx_acessos_criado ON acessos(criado_em);
    CREATE INDEX IF NOT EXISTS idx_acessos_rota_dia ON acessos(rota, dia);
    CREATE INDEX IF NOT EXISTS idx_acessos_dispositivo ON acessos(dispositivo, dia);
    CREATE INDEX IF NOT EXISTS idx_sessoes_hash ON admin_sessoes(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessoes_expira ON admin_sessoes(expira_em);
    CREATE INDEX IF NOT EXISTS idx_relatorios_criado ON relatorios(criado_em);
  `)

  if (!tabelaExiste('admin_usuarios') || !tabelaExiste('acessos') || !tabelaExiste('relatorios')) {
    throw new Error('Falha ao criar as tabelas da área administrativa.')
  }

  if (!colunaExiste('acessos', 'detalhes')) {
    banco.exec('ALTER TABLE acessos ADD COLUMN detalhes TEXT NOT NULL DEFAULT \'\'')
  }

  console.log('=== Migração 003 concluída com sucesso ===')
}

module.exports = { executar }

if (require.main === module) {
  executar()
}
