const banco = require('../src/configuracoes/conexaoBanco')

function colunaExiste(tabela, coluna) {
  const colunas = banco.prepare(`PRAGMA table_info(${tabela})`).all()
  return colunas.some(c => c.name === coluna)
}

function tabelaExiste(tabela) {
  const resultado = banco.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
  ).get(tabela)
  return !!resultado
}

function executar() {
  console.log('=== Migração 001: Escala Nacional ===')

  // 1. Atualizar tabela instituições
  console.log('Atualizando tabela instituições...')
  if (!colunaExiste('instituicoes', 'categoria_administrativa')) {
    banco.exec(`ALTER TABLE instituicoes ADD COLUMN categoria_administrativa TEXT`)
  }
  if (!colunaExiste('instituicoes', 'tipo_instituicao')) {
    banco.exec(`ALTER TABLE instituicoes ADD COLUMN tipo_instituicao TEXT`)
  }
  if (!colunaExiste('instituicoes', 'codigo_ies')) {
    banco.exec(`ALTER TABLE instituicoes ADD COLUMN codigo_ies TEXT`)
  }
  if (!colunaExiste('instituicoes', 'fonte_url')) {
    banco.exec(`ALTER TABLE instituicoes ADD COLUMN fonte_url TEXT`)
  }
  if (!colunaExiste('instituicoes', 'coletado_em')) {
    banco.exec(`ALTER TABLE instituicoes ADD COLUMN coletado_em TEXT`)
  }
  if (!colunaExiste('instituicoes', 'ativo')) {
    banco.exec(`ALTER TABLE instituicoes ADD COLUMN ativo INTEGER DEFAULT 1`)
  }
  if (!colunaExiste('instituicoes', 'created_at')) {
    banco.exec(`ALTER TABLE instituicoes ADD COLUMN created_at TEXT DEFAULT (datetime('now','localtime'))`)
  }
  if (!colunaExiste('instituicoes', 'updated_at')) {
    banco.exec(`ALTER TABLE instituicoes ADD COLUMN updated_at TEXT DEFAULT (datetime('now','localtime'))`)
  }

  // Atualizar dados existentes: marcar como federais as que já existem
  banco.exec(`
    UPDATE instituicoes
    SET categoria_administrativa = 'federal',
        tipo_instituicao = CASE
          WHEN sigla LIKE 'IF%' THEN 'instituto_federal'
          WHEN sigla LIKE 'CEFET%' THEN 'cefet'
          ELSE 'universidade'
        END
    WHERE categoria_administrativa IS NULL
  `)

  // 2. Criar tabela campi
  console.log('Criando tabela campi...')
  if (!tabelaExiste('campi')) {
    banco.exec(`
      CREATE TABLE IF NOT EXISTS campi (
        id                      INTEGER PRIMARY KEY AUTOINCREMENT,
        instituicao_id          INTEGER NOT NULL REFERENCES instituicoes(id),
        nome                    TEXT NOT NULL,
        codigo_campus           TEXT,
        codigo_municipio_ibge   TEXT,
        cidade                  TEXT,
        uf                      TEXT,
        endereco                TEXT,
        site_oficial            TEXT,
        fonte_url               TEXT,
        coletado_em             TEXT,
        ativo                   INTEGER DEFAULT 1,
        created_at              TEXT DEFAULT (datetime('now','localtime')),
        updated_at              TEXT DEFAULT (datetime('now','localtime'))
      )
    `)
  }

  // 3. Atualizar tabela cursos
  console.log('Atualizando tabela cursos...')
  if (!colunaExiste('cursos', 'campus_id')) {
    banco.exec(`ALTER TABLE cursos ADD COLUMN campus_id INTEGER REFERENCES campi(id)`)
  }
  if (!colunaExiste('cursos', 'codigo_curso')) {
    banco.exec(`ALTER TABLE cursos ADD COLUMN codigo_curso TEXT`)
  }
  if (!colunaExiste('cursos', 'turno')) {
    banco.exec(`ALTER TABLE cursos ADD COLUMN turno TEXT`)
  }
  if (!colunaExiste('cursos', 'codigo_municipio_ibge')) {
    banco.exec(`ALTER TABLE cursos ADD COLUMN codigo_municipio_ibge TEXT`)
  }
  if (!colunaExiste('cursos', 'cidade')) {
    banco.exec(`ALTER TABLE cursos ADD COLUMN cidade TEXT`)
  }
  if (!colunaExiste('cursos', 'uf')) {
    banco.exec(`ALTER TABLE cursos ADD COLUMN uf TEXT`)
  }
  if (!colunaExiste('cursos', 'fonte_url')) {
    banco.exec(`ALTER TABLE cursos ADD COLUMN fonte_url TEXT`)
  }
  if (!colunaExiste('cursos', 'coletado_em')) {
    banco.exec(`ALTER TABLE cursos ADD COLUMN coletado_em TEXT`)
  }
  if (!colunaExiste('cursos', 'ativo')) {
    banco.exec(`ALTER TABLE cursos ADD COLUMN ativo INTEGER DEFAULT 1`)
  }
  if (!colunaExiste('cursos', 'created_at')) {
    banco.exec(`ALTER TABLE cursos ADD COLUMN created_at TEXT DEFAULT (datetime('now','localtime'))`)
  }
  if (!colunaExiste('cursos', 'updated_at')) {
    banco.exec(`ALTER TABLE cursos ADD COLUMN updated_at TEXT DEFAULT (datetime('now','localtime'))`)
  }

  // Preencher cidade/uf dos cursos a partir da instituição
  banco.exec(`
    UPDATE cursos
    SET cidade = (SELECT i.cidade FROM instituicoes i WHERE i.id = cursos.instituicao_id),
        uf = (SELECT i.estado FROM instituicoes i WHERE i.id = cursos.instituicao_id)
    WHERE cidade IS NULL
  `)

  // 4. Atualizar tabela notas_corte
  console.log('Atualizando tabela notas_corte...')
  if (!colunaExiste('notas_corte', 'processo')) {
    banco.exec(`ALTER TABLE notas_corte ADD COLUMN processo TEXT`)
  }
  if (!colunaExiste('notas_corte', 'turno')) {
    banco.exec(`ALTER TABLE notas_corte ADD COLUMN turno TEXT`)
  }
  if (!colunaExiste('notas_corte', 'nota_corte')) {
    banco.exec(`ALTER TABLE notas_corte ADD COLUMN nota_corte REAL`)
  }
  if (!colunaExiste('notas_corte', 'fonte_url')) {
    banco.exec(`ALTER TABLE notas_corte ADD COLUMN fonte_url TEXT`)
  }
  if (!colunaExiste('notas_corte', 'coletado_em')) {
    banco.exec(`ALTER TABLE notas_corte ADD COLUMN coletado_em TEXT`)
  }
  if (!colunaExiste('notas_corte', 'created_at')) {
    banco.exec(`ALTER TABLE notas_corte ADD COLUMN created_at TEXT DEFAULT (datetime('now','localtime'))`)
  }
  if (!colunaExiste('notas_corte', 'updated_at')) {
    banco.exec(`ALTER TABLE notas_corte ADD COLUMN updated_at TEXT DEFAULT (datetime('now','localtime'))`)
  }

  // Migrar nota_minima -> nota_corte e modalidade_acesso -> processo
  banco.exec(`
    UPDATE notas_corte
    SET nota_corte = nota_minima
    WHERE nota_corte IS NULL AND nota_minima IS NOT NULL
  `)
  banco.exec(`
    UPDATE notas_corte
    SET processo = LOWER(modalidade_acesso)
    WHERE processo IS NULL AND modalidade_acesso IS NOT NULL
  `)

  // 5. Atualizar tabela custos_cidade
  console.log('Atualizando tabela custos_cidade...')
  if (!colunaExiste('custos_cidade', 'codigo_municipio_ibge')) {
    banco.exec(`ALTER TABLE custos_cidade ADD COLUMN codigo_municipio_ibge TEXT`)
  }
  if (!colunaExiste('custos_cidade', 'uf')) {
    banco.exec(`ALTER TABLE custos_cidade ADD COLUMN uf TEXT`)
  }
  if (!colunaExiste('custos_cidade', 'custo_total')) {
    banco.exec(`ALTER TABLE custos_cidade ADD COLUMN custo_total REAL`)
  }
  if (!colunaExiste('custos_cidade', 'tipo_fonte')) {
    banco.exec(`ALTER TABLE custos_cidade ADD COLUMN tipo_fonte TEXT DEFAULT 'estimativa'`)
  }
  if (!colunaExiste('custos_cidade', 'fonte_url')) {
    banco.exec(`ALTER TABLE custos_cidade ADD COLUMN fonte_url TEXT`)
  }
  if (!colunaExiste('custos_cidade', 'coletado_em')) {
    banco.exec(`ALTER TABLE custos_cidade ADD COLUMN coletado_em TEXT`)
  }
  if (!colunaExiste('custos_cidade', 'created_at')) {
    banco.exec(`ALTER TABLE custos_cidade ADD COLUMN created_at TEXT DEFAULT (datetime('now','localtime'))`)
  }
  if (!colunaExiste('custos_cidade', 'updated_at')) {
    banco.exec(`ALTER TABLE custos_cidade ADD COLUMN updated_at TEXT DEFAULT (datetime('now','localtime'))`)
  }

  // Preencher uf e custo_total
  banco.exec(`
    UPDATE custos_cidade
    SET uf = estado
    WHERE uf IS NULL AND estado IS NOT NULL
  `)
  banco.exec(`
    UPDATE custos_cidade
    SET custo_total = COALESCE(moradia,0) + COALESCE(alimentacao,0) + COALESCE(transporte,0) + COALESCE(outros,0)
    WHERE custo_total IS NULL
  `)

  // 6. Atualizar tabela auxilios_bolsas
  console.log('Atualizando tabela auxílios_bolsas...')
  if (!colunaExiste('auxilios_bolsas', 'campus_id')) {
    banco.exec(`ALTER TABLE auxilios_bolsas ADD COLUMN campus_id INTEGER REFERENCES campi(id)`)
  }
  if (!colunaExiste('auxilios_bolsas', 'publico_alvo')) {
    banco.exec(`ALTER TABLE auxilios_bolsas ADD COLUMN publico_alvo TEXT`)
  }
  if (!colunaExiste('auxilios_bolsas', 'valor')) {
    banco.exec(`ALTER TABLE auxilios_bolsas ADD COLUMN valor REAL`)
  }
  if (!colunaExiste('auxilios_bolsas', 'requisitos')) {
    banco.exec(`ALTER TABLE auxilios_bolsas ADD COLUMN requisitos TEXT`)
  }
  if (!colunaExiste('auxilios_bolsas', 'periodicidade')) {
    banco.exec(`ALTER TABLE auxilios_bolsas ADD COLUMN periodicidade TEXT`)
  }
  if (!colunaExiste('auxilios_bolsas', 'coletado_em')) {
    banco.exec(`ALTER TABLE auxilios_bolsas ADD COLUMN coletado_em TEXT`)
  }

  // 7. Atualizar tabela mercado_estagios
  console.log('Atualizando tabela mercado_estagios...')
  if (!colunaExiste('mercado_estagios', 'tipo_dado')) {
    banco.exec(`ALTER TABLE mercado_estagios ADD COLUMN tipo_dado TEXT DEFAULT 'estimativa'`)
  }
  if (!colunaExiste('mercado_estagios', 'fonte_url')) {
    banco.exec(`ALTER TABLE mercado_estagios ADD COLUMN fonte_url TEXT`)
  }

  // 8. Criar tabela execucoes_mineracao
  console.log('Criando tabela execucoes_mineracao...')
  if (!tabelaExiste('execucoes_mineracao')) {
    banco.exec(`
      CREATE TABLE IF NOT EXISTS execucoes_mineracao (
        id                    INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo                  TEXT NOT NULL,
        inicio                TEXT NOT NULL,
        fim                   TEXT,
        status                TEXT DEFAULT 'em_andamento',
        itens_processados     INTEGER DEFAULT 0,
        itens_inseridos       INTEGER DEFAULT 0,
        itens_atualizados     INTEGER DEFAULT 0,
        itens_ignorados       INTEGER DEFAULT 0,
        erros                 INTEGER DEFAULT 0,
        observacoes           TEXT
      )
    `)
  }

  // 9. Criar tabela instituicoes_aliases
  console.log('Criando tabela instituicoes_aliases...')
  if (!tabelaExiste('instituicoes_aliases')) {
    banco.exec(`
      CREATE TABLE IF NOT EXISTS instituicoes_aliases (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        instituicao_id  INTEGER NOT NULL REFERENCES instituicoes(id),
        alias           TEXT NOT NULL,
        fonte           TEXT,
        created_at      TEXT DEFAULT (datetime('now','localtime'))
      )
    `)
  }

  // 10. Criar novos índices
  console.log('Criando índices...')
  const indices = [
    'CREATE INDEX IF NOT EXISTS idx_inst_categoria ON instituicoes(categoria_administrativa)',
    'CREATE INDEX IF NOT EXISTS idx_inst_tipo ON instituicoes(tipo_instituicao)',
    'CREATE INDEX IF NOT EXISTS idx_inst_uf ON instituicoes(estado)',
    'CREATE INDEX IF NOT EXISTS idx_inst_codigo ON instituicoes(codigo_ies)',
    'CREATE INDEX IF NOT EXISTS idx_inst_ativo ON instituicoes(ativo)',
    'CREATE INDEX IF NOT EXISTS idx_campi_instituicao ON campi(instituicao_id)',
    'CREATE INDEX IF NOT EXISTS idx_campi_uf ON campi(uf)',
    'CREATE INDEX IF NOT EXISTS idx_campi_cidade ON campi(cidade)',
    'CREATE INDEX IF NOT EXISTS idx_campi_ibge ON campi(codigo_municipio_ibge)',
    'CREATE INDEX IF NOT EXISTS idx_cursos_campus ON cursos(campus_id)',
    'CREATE INDEX IF NOT EXISTS idx_cursos_uf ON cursos(uf)',
    'CREATE INDEX IF NOT EXISTS idx_cursos_nome ON cursos(nome)',
    'CREATE INDEX IF NOT EXISTS idx_cursos_ativo ON cursos(ativo)',
    'CREATE INDEX IF NOT EXISTS idx_notas_processo ON notas_corte(processo)',
    'CREATE INDEX IF NOT EXISTS idx_custos_ibge ON custos_cidade(codigo_municipio_ibge)',
    'CREATE INDEX IF NOT EXISTS idx_custos_uf ON custos_cidade(uf)',
    'CREATE INDEX IF NOT EXISTS idx_execucoes_tipo ON execucoes_mineracao(tipo)',
    'CREATE INDEX IF NOT EXISTS idx_aliases_instituicao ON instituicoes_aliases(instituicao_id)',
  ]
  for (const sql of indices) {
    banco.exec(sql)
  }

  console.log('=== Migração 001 concluída com sucesso ===')
}

module.exports = { executar }

if (require.main === module) {
  executar()
}
