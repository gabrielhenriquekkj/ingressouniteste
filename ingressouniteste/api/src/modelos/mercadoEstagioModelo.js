const banco = require('../configuracoes/conexaoBanco')

function buscarPorCurso(cursoId) {
  return banco.prepare(
    'SELECT * FROM mercado_estagios WHERE curso_id = ? ORDER BY regiao'
  ).all(cursoId)
}

module.exports = { buscarPorCurso }
