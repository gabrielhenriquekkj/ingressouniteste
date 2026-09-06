const banco = require('../configuracoes/conexaoBanco')

function inserirSeguro(sessaoUsuario, cursoId, instituicaoId) {
  try {
    const stmtInserir = banco.prepare(
      'INSERT INTO favoritos (sessao_usuario, curso_id, instituicao_id) VALUES (?, ?, ?)'
    )
    const resultado = stmtInserir.run(sessaoUsuario, cursoId, instituicaoId)
    return { id: resultado.lastInsertRowid, duplicate: false }
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT') {
      return { id: null, duplicate: true }
    }
    throw e
  }
}

function listarPorSessao(sessaoUsuario) {
  return banco.prepare(`
    SELECT f.id, f.criado_em,
           c.id AS curso_id, c.nome AS curso_nome, c.grau, c.modalidade,
           i.id AS instituicao_id, i.nome AS instituicao_nome, i.sigla, i.cidade, i.estado
    FROM favoritos f
    JOIN cursos c ON f.curso_id = c.id
    JOIN instituicoes i ON c.instituicao_id = i.id
    WHERE f.sessao_usuario = ?
    ORDER BY f.criado_em DESC
  `).all(sessaoUsuario)
}

function buscarPorId(id) {
  return banco.prepare('SELECT * FROM favoritos WHERE id = ?').get(id)
}

function remover(id) {
  banco.prepare('DELETE FROM favoritos WHERE id = ?').run(id)
}

module.exports = { inserirSeguro, listarPorSessao, buscarPorId, remover }
