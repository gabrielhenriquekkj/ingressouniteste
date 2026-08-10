const banco = require('../config/conexaoBanco')
const { validarBusca } = require('../utilitarios/validadores')

// Lista instituicoes com filtros (RF1)
function listarInstituicoes(req, res) {
  const { valido, erros, dados } = validarBusca(req.query)
  if (!valido) return res.status(422).json({ sucesso: false, mensagem: 'Parametros invalidos.', erros })

  let sql = 'SELECT * FROM instituicoes WHERE 1=1'
  const parametros = []

  if (dados.nome) {
    sql += ' AND nome LIKE ?'
    parametros.push(`%${dados.nome}%`)
  }
  if (dados.cidade) {
    sql += ' AND cidade LIKE ?'
    parametros.push(`%${dados.cidade}%`)
  }
  if (dados.estado) {
    sql += ' AND UPPER(estado) = UPPER(?)'
    parametros.push(dados.estado)
  }

  sql += ' ORDER BY nome'
  const instituicoes = banco.prepare(sql).all(...parametros)

  res.json({ sucesso: true, dados: instituicoes })
}

// Detalhes de uma instituicao (RF1)
function detalharInstituicao(req, res) {
  const { id } = req.params
  const instituicaoId = parseInt(id)
  if (!instituicaoId || instituicaoId <= 0)
    return res.status(400).json({ sucesso: false, mensagem: 'ID da instituicao invalido.' })

  const instituicao = banco.prepare('SELECT * FROM instituicoes WHERE id = ?').get(instituicaoId)
  if (!instituicao)
    return res.status(404).json({ sucesso: false, mensagem: 'Instituicao nao encontrada.' })

  const cursos = banco.prepare('SELECT * FROM cursos WHERE instituicao_id = ? ORDER BY nome').all(instituicaoId)
  const auxilios = banco.prepare('SELECT * FROM auxilios_bolsas WHERE instituicao_id = ? ORDER BY nome').all(instituicaoId)

  res.json({ sucesso: true, dados: { ...instituicao, cursos, auxilios } })
}

// Lista cursos com filtros (RF1)
function listarCursos(req, res) {
  const { valido, erros, dados } = validarBusca(req.query)
  if (!valido) return res.status(422).json({ sucesso: false, mensagem: 'Parametros invalidos.', erros })

  let sql = `
    SELECT c.*, i.nome AS instituicao_nome, i.sigla, i.cidade, i.estado
    FROM cursos c
    JOIN instituicoes i ON c.instituicao_id = i.id
    WHERE 1=1
  `
  const parametros = []

  if (dados.nome) {
    sql += ' AND (c.nome LIKE ? OR i.nome LIKE ?)'
    parametros.push(`%${dados.nome}%`, `%${dados.nome}%`)
  }
  if (dados.cidade) {
    sql += ' AND i.cidade LIKE ?'
    parametros.push(`%${dados.cidade}%`)
  }
  if (dados.estado) {
    sql += ' AND UPPER(i.estado) = UPPER(?)'
    parametros.push(dados.estado)
  }

  sql += ' ORDER BY c.nome'
  const cursos = banco.prepare(sql).all(...parametros)

  res.json({ sucesso: true, dados: cursos })
}

// Detalhes de um curso com todas as informacoes (RF1-RF5)
function detalharCurso(req, res) {
  const { id } = req.params
  const cursoId = parseInt(id)
  if (!cursoId || cursoId <= 0)
    return res.status(400).json({ sucesso: false, mensagem: 'ID do curso invalido.' })

  const curso = banco.prepare(`
    SELECT c.*, i.nome AS instituicao_nome, i.sigla, i.cidade, i.estado, i.site
    FROM cursos c
    JOIN instituicoes i ON c.instituicao_id = i.id
    WHERE c.id = ?
  `).get(cursoId)

  if (!curso)
    return res.status(404).json({ sucesso: false, mensagem: 'Curso nao encontrado.' })

  // Notas de corte (RF2)
  const notasCorte = banco.prepare(
    'SELECT * FROM notas_corte WHERE curso_id = ? ORDER BY ano DESC, chamada'
  ).all(cursoId)

  // Custos da cidade (RF3)
  const custos = banco.prepare(
    'SELECT * FROM custos_cidade WHERE cidade = ? ORDER BY mes_referencia DESC LIMIT 1'
  ).get(curso.cidade)

  // Auxilios e bolsas da instituicao (RF4)
  const auxiliosBolsas = banco.prepare(
    'SELECT * FROM auxilios_bolsas WHERE instituicao_id = ? ORDER BY nome'
  ).all(curso.instituicao_id)

  // Mercado e estagios (RF5)
  const mercadoEstagios = banco.prepare(
    'SELECT * FROM mercado_estagios WHERE curso_id = ? ORDER BY regiao'
  ).all(cursoId)

  res.json({
    sucesso: true,
    dados: {
      ...curso,
      notas_corte: notasCorte,
      custos,
      auxilios_bolsas: auxiliosBolsas,
      mercado_estagios: mercadoEstagios
    }
  })
}

// Notas de corte de um curso (RF2)
function notasCorte(req, res) {
  const { id } = req.params
  const cursoId = parseInt(id)
  if (!cursoId || cursoId <= 0)
    return res.status(400).json({ sucesso: false, mensagem: 'ID do curso invalido.' })

  const notas = banco.prepare(
    'SELECT * FROM notas_corte WHERE curso_id = ? ORDER BY ano DESC, chamada'
  ).all(cursoId)

  res.json({ sucesso: true, dados: notas })
}

// Custos estimados de uma cidade (RF3)
function custosCidade(req, res) {
  const { cidade } = req.params
  const cidadeSanitizada = decodeURIComponent(cidade).trim()

  if (!cidadeSanitizada)
    return res.status(400).json({ sucesso: false, mensagem: 'Nome da cidade invalido.' })

  const custos = banco.prepare(
    'SELECT * FROM custos_cidade WHERE cidade = ? ORDER BY mes_referencia DESC'
  ).all(cidadeSanitizada)

  res.json({ sucesso: true, dados: custos })
}

// Auxilios e bolsas de um curso (RF4)
function auxiliosBolsas(req, res) {
  const { id } = req.params
  const cursoId = parseInt(id)
  if (!cursoId || cursoId <= 0)
    return res.status(400).json({ sucesso: false, mensagem: 'ID do curso invalido.' })

  const curso = banco.prepare('SELECT instituicao_id FROM cursos WHERE id = ?').get(cursoId)
  if (!curso)
    return res.status(404).json({ sucesso: false, mensagem: 'Curso nao encontrado.' })

  const auxilios = banco.prepare(
    'SELECT * FROM auxilios_bolsas WHERE instituicao_id = ? ORDER BY nome'
  ).all(curso.instituicao_id)

  res.json({ sucesso: true, dados: auxilios })
}

// Mercado de trabalho e estagios (RF5)
function mercadoEstagios(req, res) {
  const { id } = req.params
  const cursoId = parseInt(id)
  if (!cursoId || cursoId <= 0)
    return res.status(400).json({ sucesso: false, mensagem: 'ID do curso invalido.' })

  const dados = banco.prepare(
    'SELECT * FROM mercado_estagios WHERE curso_id = ? ORDER BY regiao'
  ).all(cursoId)

  res.json({ sucesso: true, dados })
}

module.exports = {
  listarInstituicoes,
  detalharInstituicao,
  listarCursos,
  detalharCurso,
  notasCorte,
  custosCidade,
  auxiliosBolsas,
  mercadoEstagios
}
