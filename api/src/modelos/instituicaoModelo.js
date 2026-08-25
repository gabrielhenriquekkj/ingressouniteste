const banco = require('../configuracoes/conexaoBanco')

function buscarPorFiltros({ nome, cidade, estado }) {
  let sql = 'SELECT * FROM instituicoes WHERE 1=1'
  const parametros = []

  if (nome) {
    sql += ' AND (nome LIKE ? OR sigla LIKE ?)'
    parametros.push(`%${nome}%`, `%${nome}%`)
  }
  if (cidade) {
    sql += ' AND cidade LIKE ?'
    parametros.push(`%${cidade}%`)
  }
  if (estado) {
    sql += ' AND UPPER(estado) = UPPER(?)'
    parametros.push(estado)
  }

  sql += ' ORDER BY nome'
  return banco.prepare(sql).all(...parametros)
}

function detalhar(id) {
  return banco.prepare('SELECT * FROM instituicoes WHERE id = ?').get(id)
}

function buscarCursos(instituicaoId) {
  return banco.prepare('SELECT * FROM cursos WHERE instituicao_id = ? ORDER BY nome').all(instituicaoId)
}

function buscarAuxilios(instituicaoId) {
  return banco.prepare('SELECT * FROM auxilios_bolsas WHERE instituicao_id = ? ORDER BY nome').all(instituicaoId)
}

module.exports = { buscarPorFiltros, detalhar, buscarCursos, buscarAuxilios }
