const instituicaoModelo = require('../modelos/instituicaoModelo')
const cursoModelo = require('../modelos/cursoModelo')
const notaCorteModelo = require('../modelos/notaCorteModelo')
const custoCidadeModelo = require('../modelos/custoCidadeModelo')
const auxilioBolsaModelo = require('../modelos/auxilioBolsaModelo')
const mercadoEstagioModelo = require('../modelos/mercadoEstagioModelo')
const { validarBusca, validarId } = require('../utilitarios/validadores')

function listarInstituicoes(req, res, next) {
  try {
    const { valido, erros, dados } = validarBusca(req.query)
    if (!valido) return res.status(422).json({ sucesso: false, mensagem: 'Parametros invalidos.', erros })

    const instituicoes = instituicaoModelo.buscarPorFiltros(dados)
    res.json({ sucesso: true, mensagem: 'Instituicoes listadas com sucesso.', dados: instituicoes })
  } catch (erro) {
    next(erro)
  }
}

function detalharInstituicao(req, res, next) {
  try {
    const id = validarId(req.params.id)
    if (!id) return res.status(400).json({ sucesso: false, mensagem: 'ID da instituicao invalido.' })

    const instituicao = instituicaoModelo.detalhar(id)
    if (!instituicao)
      return res.status(404).json({ sucesso: false, mensagem: 'Instituicao nao encontrada.' })

    const cursos = instituicaoModelo.buscarCursos(id)
    const auxilios = instituicaoModelo.buscarAuxilios(id)

    res.json({ sucesso: true, mensagem: 'Instituicao detalhada com sucesso.', dados: { ...instituicao, cursos, auxilios } })
  } catch (erro) {
    next(erro)
  }
}

function listarCursos(req, res, next) {
  try {
    const { valido, erros, dados } = validarBusca(req.query)
    if (!valido) return res.status(422).json({ sucesso: false, mensagem: 'Parametros invalidos.', erros })

    const cursos = cursoModelo.buscarPorFiltros(dados)
    res.json({ sucesso: true, mensagem: 'Cursos listados com sucesso.', dados: cursos })
  } catch (erro) {
    next(erro)
  }
}

function detalharCurso(req, res, next) {
  try {
    const id = validarId(req.params.id)
    if (!id) return res.status(400).json({ sucesso: false, mensagem: 'ID do curso invalido.' })

    const curso = cursoModelo.detalhar(id)
    if (!curso)
      return res.status(404).json({ sucesso: false, mensagem: 'Curso nao encontrado.' })

    const notasCorte = notaCorteModelo.buscarPorCurso(id)
    const custos = custoCidadeModelo.buscarMaisRecente(curso.cidade)
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
    if (!id) return res.status(400).json({ sucesso: false, mensagem: 'ID do curso invalido.' })

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
      return res.status(400).json({ sucesso: false, mensagem: 'Nome da cidade invalido.' })

    const custos = custoCidadeModelo.buscarPorCidade(cidadeSanitizada)
    res.json({ sucesso: true, mensagem: 'Custos da cidade listados com sucesso.', dados: custos })
  } catch (erro) {
    next(erro)
  }
}

function auxiliosBolsas(req, res, next) {
  try {
    const id = validarId(req.params.id)
    if (!id) return res.status(400).json({ sucesso: false, mensagem: 'ID do curso invalido.' })

    const instituicaoId = cursoModelo.buscarInstituicaoId(id)
    if (!instituicaoId)
      return res.status(404).json({ sucesso: false, mensagem: 'Curso nao encontrado.' })

    const auxilios = auxilioBolsaModelo.buscarPorInstituicao(instituicaoId)
    res.json({ sucesso: true, mensagem: 'Auxilios e bolsas listados com sucesso.', dados: auxilios })
  } catch (erro) {
    next(erro)
  }
}

function mercadoEstagios(req, res, next) {
  try {
    const id = validarId(req.params.id)
    if (!id) return res.status(400).json({ sucesso: false, mensagem: 'ID do curso invalido.' })

    const dados = mercadoEstagioModelo.buscarPorCurso(id)
    res.json({ sucesso: true, mensagem: 'Mercado e estagios listados com sucesso.', dados })
  } catch (erro) {
    next(erro)
  }
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
