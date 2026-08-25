const instituicaoModelo = require('../modelos/instituicaoModelo')
const cursoModelo = require('../modelos/cursoModelo')
const { validarBusca } = require('../utilitarios/validadores')

function buscar(req, res, next) {
  try {
    const { valido, erros, dados } = validarBusca(req.query)
    if (!valido) return res.status(422).json({ sucesso: false, mensagem: 'Parametros invalidos.', erros })

    const resultados = {
      instituicoes: instituicaoModelo.buscarPorFiltros(dados),
      cursos: cursoModelo.buscarPorFiltros(dados)
    }

    res.json({ sucesso: true, mensagem: 'Busca realizada com sucesso.', dados: resultados })
  } catch (erro) {
    next(erro)
  }
}

module.exports = { buscar }
