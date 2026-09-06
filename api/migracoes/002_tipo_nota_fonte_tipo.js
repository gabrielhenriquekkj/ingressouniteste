const banco = require('../src/configuracoes/conexaoBanco')

function colunaExiste(tabela, coluna) {
  const colunas = banco.prepare(`PRAGMA table_info(${tabela})`).all()
  return colunas.some(c => c.name === coluna)
}

function executar() {
  console.log('=== Migracao 002: Tipo nota + Fonte tipo ===')

  // 1. Adicionar tipo_nota e fonte_tipo em notas_corte
  console.log('Atualizando tabela notas_corte...')
  if (!colunaExiste('notas_corte', 'tipo_nota')) {
    banco.exec(`ALTER TABLE notas_corte ADD COLUMN tipo_nota TEXT DEFAULT 'nao_identificado'`)
  }
  if (!colunaExiste('notas_corte', 'fonte_tipo')) {
    banco.exec(`ALTER TABLE notas_corte ADD COLUMN fonte_tipo TEXT DEFAULT 'oficial'`)
  }

  // Migrar dados existentes: fonte_url com SiSU_DadosAbertos_2023 -> oficial
  banco.exec(`
    UPDATE notas_corte
    SET fonte_tipo = 'oficial'
    WHERE fonte_url LIKE '%SiSU%' OR fonte_url LIKE '%MEC%'
  `)
  banco.exec(`
    UPDATE notas_corte
    SET fonte_tipo = 'secundaria'
    WHERE fonte_tipo = 'oficial' AND fonte_url LIKE '%github%'
  `)

  // 2. Adicionar fonte_tipo em custos_cidade
  console.log('Atualizando tabela custos_cidade...')
  if (!colunaExiste('custos_cidade', 'fonte_tipo')) {
    banco.exec(`ALTER TABLE custos_cidade ADD COLUMN fonte_tipo TEXT DEFAULT 'estimativa'`)
  }

  // 3. Adicionar fonte_tipo em auxilios_bolsas
  console.log('Atualizando tabela auxilios_bolsas...')
  if (!colunaExiste('auxilios_bolsas', 'fonte_tipo')) {
    banco.exec(`ALTER TABLE auxilios_bolsas ADD COLUMN fonte_tipo TEXT DEFAULT 'estimativa'`)
  }

  // 4. Criar indice de busca para notas_corte
  console.log('Criando indices...')
  banco.exec(`
    CREATE INDEX IF NOT EXISTS idx_notas_corte_busca
    ON notas_corte(curso_id, ano, chamada, modalidade_acesso)
  `)
  banco.exec(`
    CREATE INDEX IF NOT EXISTS idx_notas_corte_tipo_nota
    ON notas_corte(tipo_nota)
  `)
  banco.exec(`
    CREATE INDEX IF NOT EXISTS idx_notas_corte_fonte_tipo
    ON notas_corte(fonte_tipo)
  `)

  // 5. Adicionar organization_academica em instituicoes
  console.log('Atualizando tabela instituicoes...')
  if (!colunaExiste('instituicoes', 'organizacao_academica')) {
    banco.exec(`ALTER TABLE instituicoes ADD COLUMN organizacao_academica TEXT`)
  }
  if (!colunaExiste('instituicoes', 'situacao')) {
    banco.exec(`ALTER TABLE instituicoes ADD COLUMN situacao TEXT DEFAULT 'ativa'`)
  }

  console.log('=== Migracao 002 concluida com sucesso ===')
}

module.exports = { executar }

if (require.main === module) {
  executar()
}
