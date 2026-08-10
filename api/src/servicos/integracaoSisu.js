const banco = require('../config/conexaoBanco')

// Servico de integracao com dados de notas de corte (RF2)
// Em producao, consumiria APIs externas como SiSU/ProUni
// Por enquanto, retorna dados do banco local

function buscarNotasCorte-curso(cursoId) {
  return banco.prepare(
    'SELECT * FROM notas_corte WHERE curso_id = ? ORDER BY ano DESC, chamada'
  ).all(cursoId)
}

function buscarNotasPorInstituicao(instituicaoId) {
  return banco.prepare(`
    SELECT nc.*, c.nome AS curso_nome
    FROM notas_corte nc
    JOIN cursos c ON nc.curso_id = c.id
    WHERE c.instituicao_id = ?
    ORDER BY nc.ano DESC, nc.chamada
  `).all(instituicaoId)
}

module.exports = { buscarNotasCorte_curso: buscarNotasCorte_curso, buscarNotasPorInstituicao }
