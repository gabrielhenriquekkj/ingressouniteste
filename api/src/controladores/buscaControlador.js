const instituicaoModelo = require('../modelos/instituicaoModelo')
const cursoModelo = require('../modelos/cursoModelo')
const { validarBusca } = require('../utilitarios/validadores')

function buscar(req, res, next) {
  try {
    const { valido, erros, dados } = validarBusca(req.query)
    if (!valido) return res.status(422).json({ sucesso: false, mensagem: 'Parâmetros inválidos.', erros })

    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))

    const instituicoes = instituicaoModelo.buscarPorFiltros({ ...dados, page, limit })
    const cursos = cursoModelo.buscarPorFiltros({ ...dados, page, limit })

    res.json({
      sucesso: true,
      mensagem: 'Busca realizada com sucesso.',
      dados: {
        instituicoes: instituicoes.dados,
        cursos: cursos.dados,
        paginacao: {
          page,
          limit,
          total_instituicoes: instituicoes.total,
          total_cursos: cursos.total
        }
      }
    })
  } catch (erro) {
    next(erro)
  }
}

module.exports = { buscar }
