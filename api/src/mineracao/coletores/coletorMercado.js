const banco = require('../../configuracoes/conexaoBanco')
const log = require('../log/execucoesMineracao')

const DEMANDA_POR_GRUPO = {
  'saude': { demanda: 'alta', salario: 6500, vagas: 45 },
  'engenharia': { demanda: 'alta', salario: 5500, vagas: 35 },
  'ti': { demanda: 'alta', salario: 5000, vagas: 50 },
  'educacao': { demanda: 'media', salario: 3500, vagas: 30 },
  'administracao': { demanda: 'media', salario: 4000, vagas: 40 },
  'direito': { demanda: 'media', salario: 4500, vagas: 25 },
  'ciencias': { demanda: 'media', salario: 4000, vagas: 20 },
  'humanas': { demanda: 'baixa', salario: 3000, vagas: 15 },
  'artes': { demanda: 'baixa', salario: 2500, vagas: 10 },
  'default': { demanda: 'media', salario: 3500, vagas: 20 }
}

const GRUPO_POR_KEYWORD = {
  'medicina': 'saude', 'enfermagem': 'saude', 'odontologia': 'saude', 'farmacia': 'saude', 'psi': 'saude', 'nutricao': 'saude', 'fisioterapia': 'saude', 'biomedicina': 'saude', 'saude': 'saude',
  'engenharia': 'engenharia', 'arquitetura': 'engenharia', 'urbanismo': 'engenharia',
  'computacao': 'ti', 'informatica': 'ti', 'sistemas': 'ti', 'tecnologia': 'ti', 'dados': 'ti',
  'educacao': 'educacao', 'pedagogia': 'educacao', 'licenciatura': 'educacao', 'letras': 'educacao',
  'administracao': 'administracao', 'contabilidade': 'administracao', 'economia': 'administracao', 'marketing': 'administracao', 'financas': 'administracao',
  'direito': 'direito', 'juridico': 'direito',
  'quimica': 'ciencias', 'fisica': 'ciencias', 'matematica': 'ciencias', 'biologia': 'ciencias',
  'filosofia': 'humanas', 'historia': 'humanas', 'sociologia': 'humanas', 'antropologia': 'humanas', 'geografia': 'humanas',
  'artes': 'artes', 'musica': 'artes', 'design': 'artes', 'cinema': 'artes', 'comunicacao': 'artes', 'jornalismo': 'artes'
}

function encontrarGrupo(nomeCurso) {
  const lower = (nomeCurso || '').toLowerCase()
  for (const [keyword, grupo] of Object.entries(GRUPO_POR_KEYWORD)) {
    if (lower.includes(keyword)) return grupo
  }
  return 'default'
}

function coletar() {
  const execucaoId = log.registrarExecucao('mercado_estagios')
  const stats = { inseridos: 0, erros: 0 }

  console.log('[COLETOR MERCADO] Verificando dados existentes...')

  const jaTem = banco.prepare('SELECT COUNT(*) as n FROM mercado_estagios').get().n
  if (jaTem > 0) {
    console.log(`[COLETOR MERCADO] ${jaTem} registros já existem. Pulando.`)
    log.finalizarExecucao(execucaoId, 'sucesso', { processados: 0, inseridos: 0, atualizados: 0, erros: 0, observacoes: 'Dados já existem' })
    return stats
  }

  console.log('[COLETOR MERCADO] Populando dados de mercado de trabalho por curso...')

  const cursos = banco.prepare(`
    SELECT c.id, c.nome, i.estado
    FROM cursos c
    JOIN instituicoes i ON i.id = c.instituicao_id
    WHERE c.ativo = 1
  `).all()
  console.log(`[COLETOR MERCADO] ${cursos.length} cursos encontrados`)

  const stmtInserir = banco.prepare(`
    INSERT INTO mercado_estagios (curso_id, regiao, demanda, salario_medio, vagas_estagio, fonte, tipo_dado, atualizado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))
  `)

  const inserirBatch = banco.transaction((lista) => {
    for (const item of lista) {
      try {
        stmtInserir.run(item[0], item[1], item[2], item[3], item[4], 'Estimativa por grupo', 'estimativa')
        stats.inseridos++
      } catch (e) { stats.erros++ }
    }
  })

  let batch = []
  for (const curso of cursos) {
    const grupo = encontrarGrupo(curso.nome)
    const dados = DEMANDA_POR_GRUPO[grupo] || DEMANDA_POR_GRUPO.default
    batch.push([curso.id, curso.estado || 'BR', dados.demanda, dados.salario, dados.vagas])
    if (batch.length >= 10000) {
      inserirBatch(batch)
      batch = []
    }
  }
  if (batch.length > 0) inserirBatch(batch)

  console.log(`[COLETOR MERCADO] ${stats.inseridos} inseridos, ${stats.erros} erros`)
  log.finalizarExecucao(execucaoId, 'sucesso', { processados: cursos.length, inseridos: stats.inseridos, atualizados: 0, erros: stats.erros, observacoes: '' })
  return stats
}

module.exports = { coletar }
