const banco = require('../configuracoes/conexaoBanco')

function buscarPorCurso(cursoId) {
  return banco.prepare(
    'SELECT * FROM notas_corte WHERE curso_id = ? ORDER BY ano DESC, chamada'
  ).all(cursoId)
}

function buscarPorInstituicao(instituicaoId) {
  return banco.prepare(`
    SELECT nc.*, c.nome AS curso_nome
    FROM notas_corte nc
    JOIN cursos c ON nc.curso_id = c.id
    WHERE c.instituicao_id = ?
    ORDER BY nc.ano DESC, nc.chamada
  `).all(instituicaoId)
}

module.exports = { buscarPorCurso, buscarPorInstituicao }
