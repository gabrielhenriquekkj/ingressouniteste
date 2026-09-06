const instituicaoModelo = require('../modelos/instituicaoModelo')
const cursoModelo = require('../modelos/cursoModelo')
const notaCorteModelo = require('../modelos/notaCorteModelo')
const custoCidadeModelo = require('../modelos/custoCidadeModelo')
const auxilioBolsaModelo = require('../modelos/auxilioBolsaModelo')
const mercadoEstagioModelo = require('../modelos/mercadoEstagioModelo')
const campiModelo = require('../modelos/campiModelo')
const { validarBusca, validarId } = require('../utilitarios/validadores')

function parsePageLimit(query) {
  const page = Math.max(1, parseInt(query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20))
  return { page, limit }
}

function listarInstituicoes(req, res, next) {
  try {
    const { page, limit } = parsePageLimit(req.query)
    const filtros = {
      nome: req.query.nome || '',
      cidade: req.query.cidade || '',
      estado: req.query.estado || req.query.uf || '',
      uf: req.query.uf || '',
      categoria: req.query.categoria || '',
      tipo: req.query.tipo || ''
    }

    const resultado = instituicaoModelo.buscarPorFiltros({ ...filtros, page, limit })
    res.json({
      sucesso: true,
      mensagem: 'Instituições listadas com sucesso.',
      dados: resultado.dados,
      paginacao: { page: resultado.page, limit: resultado.limit, total: resultado.total, paginas: Math.ceil(resultado.total / resultado.limit) }
    })
  } catch (erro) {
    next(erro)
  }
}

function detalharInstituicao(req, res, next) {
  try {
    const id = validarId(req.params.id)
    if (!id) return res.status(400).json({ sucesso: false, mensagem: 'ID da instituição inválido.' })

    const instituicao = instituicaoModelo.detalhar(id)
    if (!instituicao)
      return res.status(404).json({ sucesso: false, mensagem: 'Instituição não encontrada.' })

    const cursos = instituicaoModelo.buscarCursos(id)
    const campi = instituicaoModelo.buscarCampi(id)
    const auxilios = instituicaoModelo.buscarAuxilios(id)
    const notasCorte = notaCorteModelo.buscarPorInstituicao(id)

    const cidade = instituicao.cidade || (campi.length > 0 ? campi[0].cidade : null)
    const custos = cidade ? custoCidadeModelo.buscarMaisRecente(cidade) : null

    res.json({ sucesso: true, mensagem: 'Instituição detalhada com sucesso.', dados: { ...instituicao, cursos, campi, auxilios, custos, notas_corte: notasCorte } })
  } catch (erro) {
    next(erro)
  }
}

function listarCursos(req, res, next) {
  try {
    const { page, limit } = parsePageLimit(req.query)
    const filtros = {
      nome: req.query.nome || '',
      cidade: req.query.cidade || '',
      estado: req.query.estado || req.query.uf || '',
      uf: req.query.uf || '',
      instituicao_id: parseInt(req.query.instituicao_id) || null,
      campus_id: parseInt(req.query.campus_id) || null,
      modalidade: req.query.modalidade || '',
      turno: req.query.turno || ''
    }

    const resultado = cursoModelo.buscarPorFiltros({ ...filtros, page, limit })
    res.json({
      sucesso: true,
      mensagem: 'Cursos listados com sucesso.',
      dados: resultado.dados,
      paginacao: { page: resultado.page, limit: resultado.limit, total: resultado.total, paginas: Math.ceil(resultado.total / resultado.limit) }
    })
  } catch (erro) {
    next(erro)
  }
}

function detalharCurso(req, res, next) {
  try {
    const id = validarId(req.params.id)
    if (!id) return res.status(400).json({ sucesso: false, mensagem: 'ID do curso inválido.' })

    const curso = cursoModelo.detalhar(id)
    if (!curso)
      return res.status(404).json({ sucesso: false, mensagem: 'Curso não encontrado.' })

    const notasCorte = notaCorteModelo.buscarPorCurso(id)
    const custos = custoCidadeModelo.buscarMaisRecente(curso.cidade || curso.campus_cidade)
    const auxiliosBolsas = auxilioBolsaModelo.buscarPorInstituicao(curso.instituicao_id)
    const mercadoEstagios = mercadoEstagioModelo.buscarPorCurso(id)

    res.json({
      sucesso: true,
      mensagem: 'Curso detalhado com sucesso.',
      dados: {
        ...curso,
        notas_corte: notasCorte,
        custos,
        auxilios_bolsas: auxiliosBolsas,
        mercado_estagios: mercadoEstagios
      }
    })
  } catch (erro) {
    next(erro)
  }
}

function notasCorte(req, res, next) {
  try {
    const id = validarId(req.params.id)
    if (!id) return res.status(400).json({ sucesso: false, mensagem: 'ID do curso inválido.' })

    const notas = notaCorteModelo.buscarPorCurso(id)
    res.json({ sucesso: true, mensagem: 'Notas de corte listadas com sucesso.', dados: notas })
  } catch (erro) {
    next(erro)
  }
}

function custosCidade(req, res, next) {
  try {
    const cidadeSanitizada = decodeURIComponent(req.params.cidade).trim()
    if (!cidadeSanitizada)
      return res.status(400).json({ sucesso: false, mensagem: 'Nome da cidade inválido.' })

    const custos = custoCidadeModelo.buscarPorCidade(cidadeSanitizada)
    res.json({ sucesso: true, mensagem: 'Custos da cidade listados com sucesso.', dados: custos })
  } catch (erro) {
    next(erro)
  }
}

function auxiliosBolsas(req, res, next) {
  try {
    const id = validarId(req.params.id)
    if (!id) return res.status(400).json({ sucesso: false, mensagem: 'ID do curso inválido.' })

    const instituicaoId = cursoModelo.buscarInstituicaoId(id)
    if (!instituicaoId)
      return res.status(404).json({ sucesso: false, mensagem: 'Curso não encontrado.' })

    const auxilios = auxilioBolsaModelo.buscarPorInstituicao(instituicaoId)
    res.json({ sucesso: true, mensagem: 'Auxílios e bolsas listados com sucesso.', dados: auxilios })
  } catch (erro) {
    next(erro)
  }
}

function mercadoEstagios(req, res, next) {
  try {
    const id = validarId(req.params.id)
    if (!id) return res.status(400).json({ sucesso: false, mensagem: 'ID do curso inválido.' })

    const dados = mercadoEstagioModelo.buscarPorCurso(id)
    res.json({ sucesso: true, mensagem: 'Mercado e estágios listados com sucesso.', dados })
  } catch (erro) {
    next(erro)
  }
}

function listarCampi(req, res, next) {
  try {
    const instituicaoId = parseInt(req.query.instituicao_id)
    if (!instituicaoId)
      return res.status(400).json({ sucesso: false, mensagem: 'instituição_id obrigatório.' })

    const campi = campiModelo.buscarPorInstituicao(instituicaoId)
    res.json({ sucesso: true, mensagem: 'Campi listados com sucesso.', dados: campi })
  } catch (erro) {
    next(erro)
  }
}

module.exports = {
  listarInstituicoes, detalharInstituicao,
  listarCursos, detalharCurso,
  notasCorte, custosCidade, auxiliosBolsas, mercadoEstagios,
  listarCampi
}
