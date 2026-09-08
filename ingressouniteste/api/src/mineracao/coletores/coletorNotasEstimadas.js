const banco = require('../../configuracoes/conexaoBanco')
const log = require('../log/execucoesMineracao')

const NOTAS_BASE_POR_CATEGORIA = {
  federal: 620,
  estadual: 580,
  municipal: 500,
  privada: 450
}

const AJUSTE_POR_CURSO = {
  'medicina': 80, 'odontologia': 60, 'enfermagem': 40, 'farmacia': 50,
  'direito': 70, 'psicologia': 50, 'arquitetura': 55, 'engenharia': 50,
  'administracao': 30, 'contabilidade': 25, 'economia': 40, 'relacoes publicas': 35,
  'publicidade': 25, 'jornalismo': 30, 'comunicacao': 30, 'design': 35,
  'informatica': 40, 'ciencia da computacao': 45, 'engenharia de software': 50,
  'sistemas de informacao': 40, 'rede de computadores': 30,
  'educacao': 20, 'pedagogia': 20, 'letras': 15, 'historia': 15,
  'geografia': 15, 'filosofia': 10, 'sociologia': 15, 'biologia': 25,
  'quimica': 25, 'fisica': 25, 'matematica': 20, 'estatistica': 35,
  'administracao publica': 35, 'servico social': 25, 'nutricao': 35,
  'fisioterapia': 35, 'fonoaudiologia': 35, 'terapia ocupacional': 30,
  'veterinaria': 55, 'agronomia': 30, 'engenharia agricola': 25,
  'engenharia ambiental': 35, 'engenharia civil': 40, 'engenharia eletrica': 45,
  'engenharia mecanica': 45, 'engenharia de producao': 40, 'engenharia quimica': 45,
  'musica': 20, 'artes': 15, 'teatro': 15, 'danca': 15,
  'turismo': 20, 'hotelaria': 20, 'gastronomia': 15,
  'educacao fisica': 15, 'generico': 0
}

function normalizar(str) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function estimarNota(nomeCurso, categoria) {
  const nomeNorm = normalizar(nomeCurso)
  let ajuste = 0
  for (const [chave, valor] of Object.entries(AJUSTE_POR_CURSO)) {
    if (nomeNorm.includes(chave)) {
      ajuste = Math.max(ajuste, valor)
    }
  }

  const base = NOTAS_BASE_POR_CATEGORIA[normalizar(categoria)] || 450
  const variacao = Math.round((Math.random() - 0.5) * 30)
  return Math.round((base + ajuste + variacao) * 10) / 10
}

function coletar() {
  const execucaoId = log.registrarExecucao('notas_estimadas')
  const stats = { inseridos: 0, erros: 0 }

  console.log('[NOTAS ESTIMADAS] Gerando notas estimadas para cursos sem dados SiSU...')

  const cursosSemNotas = banco.prepare(`
    SELECT c.id, c.nome, i.categoria_administrativa
    FROM cursos c
    JOIN instituicoes i ON i.id = c.instituicao_id
    WHERE c.id NOT IN (SELECT DISTINCT curso_id FROM notas_corte)
    AND i.ativo = 1
  `).all()

  console.log(`[NOTAS ESTIMADAS] ${cursosSemNotas.length} cursos sem notas de corte`)

  const stmtInserir = banco.prepare(`
    INSERT INTO notas_corte (curso_id, modalidade_acesso, processo, ano, chamada, nota_corte, fonte_url, coletado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))
  `)

  const inserirBatch = banco.transaction((lista) => {
    for (const item of lista) {
      try {
        stmtInserir.run(item.curso_id, 'ampla', 'estimativa', 2024, 1, item.nota_corte, 'estimativa_automatica')
        stats.inseridos++
      } catch (e) { stats.erros++ }
    }
  })

  const BATCH = 5000
  for (let i = 0; i < cursosSemNotas.length; i += BATCH) {
    const batch = cursosSemNotas.slice(i, i + BATCH).map(c => ({
      curso_id: c.id,
      nota_corte: estimarNota(c.nome, c.categoria_administrativa)
    }))
    inserirBatch(batch)
  }

  console.log(`[NOTAS ESTIMADAS] ${stats.inseridos} notas estimadas inseridas, ${stats.erros} erros`)
  log.finalizarExecucao(execucaoId, 'sucesso', { processados: cursosSemNotas.length, inseridos: stats.inseridos, atualizados: 0, erros: stats.erros, observacoes: '' })
  return stats
}

module.exports = { coletar }
